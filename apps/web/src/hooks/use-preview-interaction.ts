import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "@/hooks/use-editor";
import { useShiftKey } from "@/hooks/use-shift-key";
import { usePreviewViewport } from "@/components/editor/panels/preview/preview-viewport";
import type { ElementRef, TextElement, TimelineElement } from "@/lib/timeline";
import {
	getVisibleElementsWithBounds,
	type ElementWithBounds,
	type ElementBounds,
} from "@/lib/preview/element-bounds";
import {
	getHitElements,
	hitTest,
	resolvePreferredHit,
} from "@/lib/preview/hit-test";
import { isVisualElement } from "@/lib/timeline/element-utils";
import {
	SNAP_THRESHOLD_SCREEN_PIXELS,
	snapPosition,
	type SnapLine,
} from "@/lib/preview/preview-snap";
import { registerCanceller } from "@/lib/cancel-interaction";
import {
	getElementLocalTime,
	hasKeyframesForPath,
	resolveTransformAtTime,
	setChannel,
} from "@/lib/animation";

export type OnSnapLinesChange = (lines: SnapLine[]) => void;

export interface MarqueeRect {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
}

const MIN_DRAG_DISTANCE = 0.5;

interface CapturedPointerState {
	pointerId: number;
	captureTarget: HTMLElement;
}

type InteractionState =
	| { kind: "idle" }
	| {
			kind: "pending";
			startX: number;
			startY: number;
			pointerId: number;
			captureTarget: HTMLElement;
			topmostHit: ElementWithBounds | null;
			selectedHit: ElementWithBounds | null;
			selectedElements: ElementRef[];
	  }
	| {
			kind: "marquee";
			startX: number;
			startY: number;
			pointerId: number;
			captureTarget: HTMLElement;
			rect: MarqueeRect;
	  }
	| {
			kind: "dragging";
			startX: number;
			startY: number;
			pointerId: number;
			captureTarget: HTMLElement;
			bounds: {
				width: number;
				height: number;
				rotation: number;
			};
			elements: Array<{
				trackId: string;
				elementId: string;
				initialTransform: Transform;
				finalPosition: { x: number; y: number };
				animationsWithoutPosition?: ReturnType<typeof setChannel>;
				shouldClearPositionAnimation: boolean;
			}>;
	  };

function isSameElementRef({
	left,
	right,
}: {
	left: ElementRef;
	right: ElementRef;
}): boolean {
	return left.trackId === right.trackId && left.elementId === right.elementId;
}

function buildDragSelection({
	selectedElements,
	dragTarget,
}: {
	selectedElements: ElementRef[];
	dragTarget: ElementWithBounds;
}): ElementRef[] {
	const dragTargetRef = {
		trackId: dragTarget.trackId,
		elementId: dragTarget.elementId,
	};

	if (
		!selectedElements.some((selectedElement) =>
			isSameElementRef({ left: selectedElement, right: dragTargetRef }),
		)
	) {
		return [dragTargetRef];
	}

	return [
		dragTargetRef,
		...selectedElements.filter(
			(selectedElement) =>
				!isSameElementRef({ left: selectedElement, right: dragTargetRef }),
		),
	];
}

function boundsOverlapMarquee(
	bounds: ElementBounds,
	rect: { x1: number; y1: number; x2: number; y2: number },
): boolean {
	const left = Math.min(rect.x1, rect.x2);
	const right = Math.max(rect.x1, rect.x2);
	const top = Math.min(rect.y1, rect.y2);
	const bottom = Math.max(rect.y1, rect.y2);

	const halfW = bounds.width / 2;
	const halfH = bounds.height / 2;
	const elLeft = bounds.cx - halfW;
	const elRight = bounds.cx + halfW;
	const elTop = bounds.cy - halfH;
	const elBottom = bounds.cy + halfH;

	return elLeft < right && elRight > left && elTop < bottom && elBottom > top;
}

export function usePreviewInteraction({
	onSnapLinesChange,
	isMaskMode = false,
}: {
	onSnapLinesChange?: OnSnapLinesChange;
	isMaskMode?: boolean;
}) {
	const editor = useEditor();
	const isShiftHeldRef = useShiftKey();
	const viewport = usePreviewViewport();
	const [isDragging, setIsDragging] = useState(false);
	const [editingText, setEditingText] = useState<{
		trackId: string;
		elementId: string;
		element: TextElement;
		originalOpacity: number;
	} | null>(null);
	const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
	const marqueeRectRef = useRef<MarqueeRect | null>(null);
	const interactionRef = useRef<InteractionState>({ kind: "idle" });
	const pendingPreviewUpdatesRef = useRef<Array<{
		trackId: string;
		elementId: string;
		updates: Partial<TimelineElement>;
	}> | null>(null);
	const pendingPreviewFrameRef = useRef<number | null>(null);
	const wasPlayingRef = useRef(editor.playback.getIsPlaying());
	const editingTextRef = useRef(editingText);
	editingTextRef.current = editingText;
	useEffect(() => {
		marqueeRectRef.current = marqueeRect;
	}, [marqueeRect]);

	const clearScheduledPreview = useCallback(() => {
		if (pendingPreviewFrameRef.current !== null) {
			cancelAnimationFrame(pendingPreviewFrameRef.current);
			pendingPreviewFrameRef.current = null;
		}
		pendingPreviewUpdatesRef.current = null;
	}, []);

	const flushScheduledPreview = useCallback(() => {
		if (pendingPreviewFrameRef.current !== null) {
			cancelAnimationFrame(pendingPreviewFrameRef.current);
			pendingPreviewFrameRef.current = null;
		}
		const pendingUpdates = pendingPreviewUpdatesRef.current;
		pendingPreviewUpdatesRef.current = null;
		if (pendingUpdates && pendingUpdates.length > 0) {
			editor.timeline.previewElements({ updates: pendingUpdates });
		}
	}, [editor.timeline]);

	const clearInteractionState = useCallback(() => {
		interactionRef.current = { kind: "idle" };
		marqueeRectRef.current = null;
		setMarqueeRect(null);
		setIsDragging(false);
		onSnapLinesChange?.([]);
		clearScheduledPreview();
	}, [clearScheduledPreview, onSnapLinesChange]);

	const schedulePreviewElements = useCallback(
		(
			updates: Array<{
				trackId: string;
				elementId: string;
				updates: Partial<TimelineElement>;
			}>,
		) => {
			pendingPreviewUpdatesRef.current = updates;
			if (pendingPreviewFrameRef.current !== null) {
				return;
			}

			pendingPreviewFrameRef.current = requestAnimationFrame(() => {
				pendingPreviewFrameRef.current = null;
				const pendingUpdates = pendingPreviewUpdatesRef.current;
				pendingPreviewUpdatesRef.current = null;
				if (pendingUpdates && pendingUpdates.length > 0) {
					editor.timeline.previewElements({ updates: pendingUpdates });
				}
			});
		},
		[editor.timeline],
	);

	useEffect(() => () => clearScheduledPreview(), [clearScheduledPreview]);

	const releaseCapturedPointer = useCallback(
		(pointerState: CapturedPointerState | null) => {
			if (!pointerState) return;

			if (
				!pointerState.captureTarget.hasPointerCapture(pointerState.pointerId)
			) {
				return;
			}

			pointerState.captureTarget.releasePointerCapture(pointerState.pointerId);
		},
		[],
	);

	const commitTextEdit = useCallback(() => {
		const current = editingTextRef.current;
		if (!current) return;
		editingTextRef.current = null;
		editor.timeline.commitPreview();
		setEditingText(null);
	}, [editor.timeline]);

	useEffect(() => {
		const unsubscribe = editor.playback.subscribe(() => {
			const isPlaying = editor.playback.getIsPlaying();
			if (isPlaying && !wasPlayingRef.current && editingTextRef.current) {
				commitTextEdit();
			}
			wasPlayingRef.current = isPlaying;
		});
		return unsubscribe;
	}, [editor.playback, commitTextEdit]);

	useEffect(() => {
		if (!isDragging) return;

		return registerCanceller({
			fn: () => {
				const state = interactionRef.current;
				if (state.kind === "idle") return;

				if (state.kind === "dragging") {
					editor.timeline.discardPreview();
				}

				clearInteractionState();
				releaseCapturedPointer(state.kind === "idle" ? null : state);
			},
		});
	}, [
		clearInteractionState,
		editor.timeline,
		isDragging,
		releaseCapturedPointer,
	]);

	const handleDoubleClick = useCallback(
		({ clientX, clientY }: React.MouseEvent) => {
			if (editingText || isMaskMode) return;

			const tracks = editor.scenes.getActiveScene().tracks;
			const currentTime = editor.playback.getCurrentTime();
			const mediaAssets = editor.media.getAssets();
			const canvasSize = editor.project.getActive().settings.canvasSize;

			const startPos = viewport.screenToCanvas({
				clientX,
				clientY,
			});
			if (!startPos) return;

			const elementsWithBounds = getVisibleElementsWithBounds({
				tracks,
				currentTime,
				canvasSize,
				mediaAssets,
			});

			const hit = hitTest({
				canvasX: startPos.x,
				canvasY: startPos.y,
				elementsWithBounds,
			});

			if (!hit || hit.element.type !== "text") return;

			const textElement = hit.element as TextElement;
			setEditingText({
				trackId: hit.trackId,
				elementId: hit.elementId,
				element: textElement,
				originalOpacity: textElement.opacity,
			});
		},
		[editor, editingText, isMaskMode, viewport],
	);

	const handlePointerDown = useCallback(
		(event: React.PointerEvent) => {
			if (editingText) return;
			if (isMaskMode) return;
			if (event.button !== 0) return;
			event.preventDefault();

			const { clientX, clientY, currentTarget, pointerId } = event;

			const tracks = editor.scenes.getActiveScene().tracks;
			const currentTime = editor.playback.getCurrentTime();
			const mediaAssets = editor.media.getAssets();
			const canvasSize = editor.project.getActive().settings.canvasSize;

			const startPos = viewport.screenToCanvas({
				clientX,
				clientY,
			});
			if (!startPos) return;

			const elementsWithBounds = getVisibleElementsWithBounds({
				tracks,
				currentTime,
				canvasSize,
				mediaAssets,
			});

			const isOutsideCanvas =
				startPos.x < -0.5 ||
				startPos.y < -0.5 ||
				startPos.x > canvasSize.width + 0.5 ||
				startPos.y > canvasSize.height + 0.5;
			const hits = isOutsideCanvas
				? []
				: getHitElements({
						canvasX: startPos.x,
						canvasY: startPos.y,
						elementsWithBounds,
					});
			const selectedElements = editor.selection.getSelectedElements();
			const topmostHit = hits[0] ?? null;
			const captureTarget = currentTarget as HTMLElement;

			if (topmostHit === null) {
				const rect = {
					startX: startPos.x,
					startY: startPos.y,
					endX: startPos.x,
					endY: startPos.y,
				};
				interactionRef.current = {
					kind: "marquee",
					startX: startPos.x,
					startY: startPos.y,
					pointerId,
					captureTarget,
					rect,
				};
				marqueeRectRef.current = rect;
				setMarqueeRect(rect);
				setIsDragging(true);
				captureTarget.setPointerCapture(pointerId);
				return;
			}

			interactionRef.current = {
				kind: "pending",
				startX: startPos.x,
				startY: startPos.y,
				pointerId,
				captureTarget,
				topmostHit,
				selectedHit: resolvePreferredHit({
					hits,
					preferredElements: selectedElements,
				}),
				selectedElements,
			};
			captureTarget.setPointerCapture(pointerId);
		},
		[editor, editingText, isMaskMode, viewport],
	);

	const handlePointerMove = useCallback(
		({ clientX, clientY }: React.PointerEvent) => {
			const canvasSize = editor.project.getActive().settings.canvasSize;
			const currentTime = editor.playback.getCurrentTime();

			const currentPos = viewport.screenToCanvas({
				clientX,
				clientY,
			});
			if (!currentPos) return;

			const state = interactionRef.current;

			if (state.kind === "marquee") {
				const nextMarqueeRect = {
					startX: state.startX,
					startY: state.startY,
					endX: currentPos.x,
					endY: currentPos.y,
				};
				state.rect = nextMarqueeRect;
				marqueeRectRef.current = nextMarqueeRect;
				setMarqueeRect(nextMarqueeRect);
				return;
			}

			let activeDragState: Extract<
				InteractionState,
				{ kind: "dragging" }
			> | null = null;

			if (state.kind === "dragging") {
				activeDragState = state;
			} else if (state.kind === "pending") {
				const deltaX = currentPos.x - state.startX;
				const deltaY = currentPos.y - state.startY;
				const hasMovement =
					Math.abs(deltaX) > MIN_DRAG_DISTANCE ||
					Math.abs(deltaY) > MIN_DRAG_DISTANCE;

				if (!hasMovement) {
					onSnapLinesChange?.([]);
					return;
				}

				const dragTarget = state.selectedHit ?? state.topmostHit;
				if (!dragTarget) {
					const nextMarqueeRect = {
						startX: state.startX,
						startY: state.startY,
						endX: currentPos.x,
						endY: currentPos.y,
					};
					interactionRef.current = {
						kind: "marquee",
						startX: state.startX,
						startY: state.startY,
						pointerId: state.pointerId,
						captureTarget: state.captureTarget,
						rect: nextMarqueeRect,
					};
					marqueeRectRef.current = nextMarqueeRect;
					setMarqueeRect(nextMarqueeRect);
					setIsDragging(true);
					return;
				}

				const dragSelection = buildDragSelection({
					selectedElements: state.selectedElements,
					dragTarget,
				});
				const elementsWithTracks = editor.timeline.getElementsWithTracks({
					elements: dragSelection,
				});
				const draggableElements = elementsWithTracks.filter(({ element }) =>
					isVisualElement(element),
				);

				if (draggableElements.length === 0) {
					clearInteractionState();
					releaseCapturedPointer(state);
					return;
				}

				if (state.selectedHit === null) {
					editor.selection.setSelectedElements({
						elements: [
							{
								trackId: dragTarget.trackId,
								elementId: dragTarget.elementId,
							},
						],
					});
				}

				activeDragState = {
					kind: "dragging",
					startX: state.startX,
					startY: state.startY,
					pointerId: state.pointerId,
					captureTarget: state.captureTarget,
					bounds: {
						width: dragTarget.bounds.width,
						height: dragTarget.bounds.height,
						rotation: dragTarget.bounds.rotation,
					},
					elements: draggableElements.map(({ track, element }) => {
						const localTime = getElementLocalTime({
							timelineTime: currentTime,
							elementStartTime: element.startTime,
							elementDuration: element.duration,
						});
						const shouldClearPositionAnimation =
							hasKeyframesForPath({
								animations: element.animations,
								propertyPath: "transform.positionX",
							}) ||
							hasKeyframesForPath({
								animations: element.animations,
								propertyPath: "transform.positionY",
							});

						const resolvedTransform = resolveTransformAtTime({
							baseTransform: (element as { transform: Transform }).transform,
							animations: element.animations,
							localTime,
						});

						return {
							trackId: track.id,
							elementId: element.id,
							initialTransform: resolvedTransform,
							finalPosition: resolvedTransform.position,
							shouldClearPositionAnimation,
							animationsWithoutPosition: shouldClearPositionAnimation
								? setChannel({
										animations: setChannel({
											animations: element.animations,
											propertyPath: "transform.positionX",
											channel: undefined,
										}),
										propertyPath: "transform.positionY",
										channel: undefined,
									})
								: undefined,
						};
					}),
				};
				interactionRef.current = activeDragState;
				setIsDragging(true);
			} else {
				return;
			}

			const deltaX = currentPos.x - activeDragState.startX;
			const deltaY = currentPos.y - activeDragState.startY;
			const firstElement = activeDragState.elements[0];
			const proposedPosition = {
				x: firstElement.initialTransform.position.x + deltaX,
				y: firstElement.initialTransform.position.y + deltaY,
			};

			const shouldSnap = !isShiftHeldRef.current;
			const snapThreshold = viewport.screenPixelsToLogicalThreshold({
				screenPixels: SNAP_THRESHOLD_SCREEN_PIXELS,
			});
			const { snappedPosition, activeLines } = shouldSnap
				? snapPosition({
						proposedPosition,
						canvasSize,
						elementSize: activeDragState.bounds,
						rotation: activeDragState.bounds.rotation,
						snapThreshold,
					})
				: {
						snappedPosition: proposedPosition,
						activeLines: [] as SnapLine[],
					};

			const deltaSnappedX =
				snappedPosition.x - firstElement.initialTransform.position.x;
			const deltaSnappedY =
				snappedPosition.y - firstElement.initialTransform.position.y;

			const updates = activeDragState.elements.map((el) => {
				const newPos = {
					x: el.initialTransform.position.x + deltaSnappedX,
					y: el.initialTransform.position.y + deltaSnappedY,
				};
				el.finalPosition = newPos;
				return {
					trackId: el.trackId,
					elementId: el.elementId,
					updates: {
						transform: {
							...el.initialTransform,
							position: newPos,
						},
						...(el.shouldClearPositionAnimation && {
							animations: el.animationsWithoutPosition,
						}),
					},
				};
			});

			onSnapLinesChange?.(activeLines);
			schedulePreviewElements(updates);
		},
		[
			editor,
			clearInteractionState,
			isShiftHeldRef,
			onSnapLinesChange,
			releaseCapturedPointer,
			schedulePreviewElements,
			viewport,
		],
	);

	const handlePointerUp = useCallback(
		({ type }: React.PointerEvent) => {
			const state = interactionRef.current;

			if (state.kind === "marquee") {
				interactionRef.current = { kind: "idle" };
				marqueeRectRef.current = null;
				setMarqueeRect(null);
				clearScheduledPreview();
				onSnapLinesChange?.([]);
				releaseCapturedPointer(state);

				if (type !== "pointercancel") {
					const tracks = editor.scenes.getActiveScene().tracks;
					const currentTime = editor.playback.getCurrentTime();
					const mediaAssets = editor.media.getAssets();
					const canvasSize = editor.project.getActive().settings.canvasSize;

					const elementsWithBounds = getVisibleElementsWithBounds({
						tracks,
						currentTime,
						canvasSize,
						mediaAssets,
					});

					const isShift = isShiftHeldRef.current;
					const existingSelection = isShift
						? editor.selection.getSelectedElements()
						: [];

					const selected: ElementRef[] = [...existingSelection];

					for (const el of elementsWithBounds) {
						if (
							boundsOverlapMarquee(el.bounds, {
								x1: state.rect.startX,
								y1: state.rect.startY,
								x2: state.rect.endX,
								y2: state.rect.endY,
							})
						) {
							const ref: ElementRef = {
								trackId: el.trackId,
								elementId: el.elementId,
							};
							if (
								!selected.some((s) => isSameElementRef({ left: s, right: ref }))
							) {
								selected.push(ref);
							}
						}
					}

					if (selected.length > 0) {
						editor.selection.setSelectedElements({ elements: selected });
					} else {
						editor.selection.clearSelection();
					}
				}

				return;
			}

			if (state.kind === "dragging") {
				flushScheduledPreview();

				if (type === "pointercancel") {
					editor.timeline.discardPreview();
				} else {
					editor.timeline.discardPreview();

					const currentTime = editor.playback.getCurrentTime();
					for (const el of state.elements) {
						const element = editor.timeline.getElementsWithTracks({
							elements: [{ trackId: el.trackId, elementId: el.elementId }],
						})[0]?.element;
						if (!element) continue;
						if (!isVisualElement(element)) continue;
						const localTime = getElementLocalTime({
							timelineTime: currentTime,
							elementStartTime: element.startTime,
							elementDuration: element.duration,
						});
						if (localTime < 0) continue;

						const deltaSnappedX =
							el.finalPosition.x - el.initialTransform.position.x;
						const deltaSnappedY =
							el.finalPosition.y - el.initialTransform.position.y;

						editor.timeline.upsertKeyframes({
							keyframes: [
								{
									trackId: el.trackId,
									elementId: el.elementId,
									propertyPath: "transform.positionX",
									time: localTime,
									value: el.initialTransform.position.x + deltaSnappedX,
								},
								{
									trackId: el.trackId,
									elementId: el.elementId,
									propertyPath: "transform.positionY",
									time: localTime,
									value: el.initialTransform.position.y + deltaSnappedY,
								},
							],
						});
					}
				}

				clearInteractionState();
				releaseCapturedPointer(state);
				return;
			}

			if (state.kind !== "pending") return;

			if (type !== "pointercancel") {
				const clickTarget = state.topmostHit;
				if (!clickTarget) {
					editor.selection.clearSelection();
				} else {
					editor.selection.setSelectedElements({
						elements: [
							{
								trackId: clickTarget.trackId,
								elementId: clickTarget.elementId,
							},
						],
					});
				}
			}

			clearInteractionState();
			releaseCapturedPointer(state);
		},
		[
			clearInteractionState,
			editor,
			isShiftHeldRef,
			flushScheduledPreview,
			onSnapLinesChange,
			releaseCapturedPointer,
			clearScheduledPreview,
		],
	);

	return {
		onPointerDown: handlePointerDown,
		onPointerMove: handlePointerMove,
		onPointerUp: handlePointerUp,
		onDoubleClick: handleDoubleClick,
		editingText,
		commitTextEdit,
		marqueeRect,
	};
}
