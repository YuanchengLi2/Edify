"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useEditor } from "@/hooks/use-editor";
import { useRafLoop } from "@/hooks/use-raf-loop";
import { useContainerSize } from "@/hooks/use-container-size";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { CanvasRenderer } from "@/services/renderer/canvas-renderer";
import { TICKS_PER_SECOND } from "@/lib/wasm";
import type { RootNode } from "@/services/renderer/nodes/root-node";
import { buildScene } from "@/services/renderer/scene-builder";
import { PreviewInteractionOverlay } from "./preview-interaction-overlay";
import { BookmarkNoteOverlay } from "./bookmark-note-overlay";
import { GuideOverlay } from "./guide-overlay";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { usePreviewStore } from "@/stores/preview-store";
import { PreviewContextMenu } from "./context-menu";
import { PreviewToolbar } from "./toolbar";
import {
	PreviewViewportProvider,
	usePreviewViewportState,
} from "./preview-viewport";
import {
	ASPECT_PRESETS,
	type AspectPresetKey,
} from "@/lib/canvas/aspect-presets";

function usePreviewSize() {
	const canvasSize = useEditor(
		(e) => e.project.getActive()?.settings.canvasSize,
	);

	return {
		width: canvasSize?.width,
		height: canvasSize?.height,
	};
}

function normalizeWheelDelta({
	delta,
	deltaMode,
	pageSize,
}: {
	delta: number;
	deltaMode: number;
	pageSize: number;
}): number {
	if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
		return delta * 16;
	}

	if (deltaMode === WheelEvent.DOM_DELTA_PAGE) {
		return delta * pageSize;
	}

	return delta;
}

export function PreviewPanel() {
	const containerRef = useRef<HTMLDivElement>(null);
	const { toggleFullscreen } = useFullscreen({ containerRef });

	return (
		<div
			ref={containerRef}
			className="panel bg-background relative flex size-full min-h-0 min-w-0 flex-col rounded-sm border"
		>
			<PreviewCanvas
				containerRef={containerRef}
				onToggleFullscreen={toggleFullscreen}
			/>
			<RenderTreeController />
		</div>
	);
}

function RenderTreeController() {
	const editor = useEditor();
	const tracks = useEditor(
		(e) => e.timeline.getPreviewTracks() ?? e.scenes.getActiveScene().tracks,
	);
	const mediaAssets = useEditor((e) => e.media.getAssets());
	const activeProject = useEditor((e) => e.project.getActive());
	const background = activeProject?.settings.background;

	const { width, height } = usePreviewSize();

	useEffect(() => {
		if (!activeProject) return;

		const duration = editor.timeline.getTotalDuration();
		const renderTree = buildScene({
			tracks,
			mediaAssets,
			duration,
			canvasSize: { width, height },
			background,
			isPreview: true,
		});

		editor.renderer.setRenderTree({ renderTree });
	}, [tracks, mediaAssets, background, width, height, editor, activeProject]);

	return null;
}

function PreviewCanvas({
	containerRef,
	onToggleFullscreen,
}: {
	containerRef: React.RefObject<HTMLElement | null>;
	onToggleFullscreen: () => void;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<HTMLDivElement>(null);
	const lastFrameRef = useRef(-1);
	const lastSceneRef = useRef<RootNode | null>(null);
	const lastDirtyVersionRef = useRef(0);
	const renderingRef = useRef(false);
	const renderTreeRef = useRef<RootNode | null>(null);
	const { width: nativeWidth, height: nativeHeight } = usePreviewSize();
	const wrapperSize = useContainerSize({ containerRef: wrapperRef });
	const aspectRatioKey = usePreviewStore((s) => s.aspectRatio);
	const ratioValue = ASPECT_PRESETS[aspectRatioKey as AspectPresetKey];
	const { frameWidth, frameHeight } = useMemo(() => {
		if (!ratioValue || !wrapperSize.width || !wrapperSize.height) {
			return {
				frameWidth: wrapperSize.width,
				frameHeight: wrapperSize.height,
			};
		}
		const actualRatio = wrapperSize.width / wrapperSize.height;
		if (actualRatio > ratioValue) {
			return {
				frameWidth: wrapperSize.height * ratioValue,
				frameHeight: wrapperSize.height,
			};
		}
		return {
			frameWidth: wrapperSize.width,
			frameHeight: wrapperSize.width / ratioValue,
		};
	}, [wrapperSize.width, wrapperSize.height, ratioValue]);
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());
	const renderTree = useEditor((e) => e.renderer.getRenderTree());
	renderTreeRef.current = renderTree ?? null;
	const { overlays } = usePreviewStore();
	const viewport = usePreviewViewportState({
		canvasHeight: nativeHeight,
		canvasWidth: nativeWidth,
		viewportHeight: frameHeight || wrapperSize.height,
		viewportWidth: frameWidth || wrapperSize.width,
		viewportRef: viewportRef,
	});

	const renderer = useMemo(() => {
		return new CanvasRenderer({
			width: nativeWidth,
			height: nativeHeight,
			fps: activeProject.settings.fps,
		});
	}, [nativeWidth, nativeHeight, activeProject.settings.fps]);

	const render = useCallback(() => {
		if (renderingRef.current) return;

		const tree = renderTreeRef.current;
		if (!canvasRef.current || !tree) return;

		const renderTime = Math.min(
			editor.playback.getCurrentTime(),
			editor.timeline.getLastFrameTime(),
		);
		const ticksPerFrame = Math.round(
			(TICKS_PER_SECOND * renderer.fps.denominator) / renderer.fps.numerator,
		);
		const frame = Math.floor(renderTime / ticksPerFrame);
		const dirtyVersion = tree.dirtyVersion;

		if (
			frame !== lastFrameRef.current ||
			tree !== lastSceneRef.current ||
			dirtyVersion !== lastDirtyVersionRef.current
		) {
			renderingRef.current = true;
			lastSceneRef.current = tree;
			lastFrameRef.current = frame;
			lastDirtyVersionRef.current = dirtyVersion;
			renderer
				.renderToCanvas({
					node: tree,
					time: renderTime,
					targetCanvas: canvasRef.current,
				})
				.then(() => {
					renderingRef.current = false;
				})
				.catch(() => {
					renderingRef.current = false;
				});
		}
	}, [renderer, editor.playback, editor.timeline]);

	useRafLoop(render, { fps: 60 });

	useEffect(() => {
		const container = viewportRef.current;
		if (!container) return;

		let pendingZoomDelta = 0;
		let pendingPanDeltaX = 0;
		let pendingPanDeltaY = 0;
		let zoomRafId: ReturnType<typeof requestAnimationFrame> | null = null;
		let panRafId: ReturnType<typeof requestAnimationFrame> | null = null;

		const onWheel = (event: WheelEvent) => {
			const normalizedDeltaX = normalizeWheelDelta({
				delta: event.deltaX,
				deltaMode: event.deltaMode,
				pageSize: container.clientWidth,
			});
			const normalizedDeltaY = normalizeWheelDelta({
				delta: event.deltaY,
				deltaMode: event.deltaMode,
				pageSize: container.clientHeight,
			});
			const isZoomGesture = event.ctrlKey || event.metaKey;
			if (isZoomGesture) {
				event.preventDefault();
				pendingZoomDelta += normalizedDeltaY;

				if (zoomRafId === null) {
					zoomRafId = requestAnimationFrame(() => {
						const cappedDelta =
							Math.sign(pendingZoomDelta) *
							Math.min(Math.abs(pendingZoomDelta), 30);
						const zoomFactor = Math.exp(-cappedDelta / 300);

						viewport.scaleZoom({ factor: zoomFactor });
						pendingZoomDelta = 0;
						zoomRafId = null;
					});
				}

				return;
			}

			if (!viewport.canPan) {
				return;
			}

			if (normalizedDeltaX === 0 && normalizedDeltaY === 0) {
				return;
			}

			event.preventDefault();
			pendingPanDeltaX += normalizedDeltaX;
			pendingPanDeltaY += normalizedDeltaY;

			if (panRafId === null) {
				panRafId = requestAnimationFrame(() => {
					viewport.panByScreenDelta({
						deltaX: pendingPanDeltaX,
						deltaY: pendingPanDeltaY,
					});
					pendingPanDeltaX = 0;
					pendingPanDeltaY = 0;
					panRafId = null;
				});
			}
		};

		container.addEventListener("wheel", onWheel, {
			capture: true,
			passive: false,
		});

		return () => {
			container.removeEventListener("wheel", onWheel, {
				capture: true,
			});
			if (zoomRafId !== null) {
				cancelAnimationFrame(zoomRafId);
			}
			if (panRafId !== null) {
				cancelAnimationFrame(panRafId);
			}
		};
	}, [viewport.canPan, viewport.panByScreenDelta, viewport.scaleZoom]);

	return (
		<PreviewViewportProvider value={viewport}>
			<div className="flex size-full min-h-0 min-w-0 flex-col">
				<div ref={wrapperRef} className="flex min-h-0 min-w-0 flex-1 p-2 pb-0">
					<ContextMenu>
						<ContextMenuTrigger asChild>
							<div
								ref={viewportRef}
								className="relative flex shrink-0 items-center justify-center overflow-hidden bg-black"
								style={{
									width: frameWidth ? `${frameWidth}px` : "100%",
									height: frameHeight ? `${frameHeight}px` : "100%",
									margin: "auto",
								}}
							>
								<div ref={frameRef} className="relative size-full">
									<canvas
										ref={canvasRef}
										width={nativeWidth}
										height={nativeHeight}
										className="absolute block"
										style={{
											left: viewport.sceneLeft,
											top: viewport.sceneTop,
											width: viewport.sceneWidth,
											height: viewport.sceneHeight,
											background:
												activeProject.settings.background.type === "blur"
													? "transparent"
													: activeProject?.settings.background.color,
										}}
									/>
									<GuideOverlay />
									<PreviewInteractionOverlay />
									{overlays.bookmarks && <BookmarkNoteOverlay />}
								</div>
							</div>
						</ContextMenuTrigger>
						<PreviewContextMenu
							onToggleFullscreen={onToggleFullscreen}
							containerRef={containerRef}
						/>
					</ContextMenu>
				</div>
				<PreviewToolbar onToggleFullscreen={onToggleFullscreen} />
			</div>
		</PreviewViewportProvider>
	);
}
