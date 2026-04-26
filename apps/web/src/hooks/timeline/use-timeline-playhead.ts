import { snappedSeekTime } from "opencut-wasm";
import { TICKS_PER_SECOND } from "@/lib/wasm";
import { useEffect, useCallback, useRef } from "react";
import { useEdgeAutoScroll } from "@/hooks/timeline/use-edge-auto-scroll";
import { useEditor } from "../use-editor";
import { useShiftKey } from "@/hooks/use-shift-key";
import { findSnapPoints, snapToNearestPoint } from "@/lib/timeline/snap-utils";
import {
	getCenteredLineLeft,
	timelineTimeToPixels,
	timelineTimeToSnappedPixels,
} from "@/lib/timeline";
import { BASE_TIMELINE_PIXELS_PER_SECOND } from "@/lib/timeline/scale";

interface UseTimelinePlayheadProps {
	zoomLevel: number;
	rulerRef: React.RefObject<HTMLDivElement | null>;
	rulerScrollRef: React.RefObject<HTMLDivElement | null>;
	tracksScrollRef: React.RefObject<HTMLDivElement | null>;
	playheadRef?: React.RefObject<HTMLDivElement | null>;
}

export function useTimelinePlayhead({
	zoomLevel,
	rulerRef,
	rulerScrollRef,
	tracksScrollRef,
	playheadRef,
}: UseTimelinePlayheadProps) {
	const editor = useEditor();
	const isScrubbing = useEditor((e) => e.playback.getIsScrubbing());
	const activeProject = useEditor((e) => e.project.getActive());
	const duration = useEditor((e) => e.timeline.getTotalDuration());
	const activeScene = useEditor((e) => e.scenes.getActiveScene());
	const isShiftHeldRef = useShiftKey();

	const zoomLevelRef = useRef(zoomLevel);
	const durationRef = useRef(duration);
	const isScrubbingRef = useRef(isScrubbing);
	const isPlayingRef = useRef(false);

	useEffect(() => {
		zoomLevelRef.current = zoomLevel;
		durationRef.current = duration;
		isScrubbingRef.current = isScrubbing;
		isPlayingRef.current = editor.playback.getIsPlaying();
	}, [zoomLevel, duration, isScrubbing, editor.playback]);

	const seek = useCallback(
		({ time }: { time: number }) => editor.playback.seek({ time }),
		[editor.playback],
	);

	const scrubTimeRef = useRef<number | null>(null);
	const isDraggingRulerRef = useRef(false);
	const hasDraggedRulerRef = useRef(false);
	const lastMouseXRef = useRef<number>(0);
	const pendingRulerScrubRef = useRef<{
		startX: number;
		startY: number;
	} | null>(null);

	const handleScrub = useCallback(
		({
			event,
			snappingEnabled = true,
		}: {
			event: MouseEvent | React.MouseEvent;
			snappingEnabled?: boolean;
		}) => {
			const ruler = rulerRef.current;
			if (!ruler) return;
			const rulerRect = ruler.getBoundingClientRect();
			const relativeMouseX = event.clientX - rulerRect.left;

			const timelineContentWidth = timelineTimeToPixels({
				time: duration,
				zoomLevel,
			});

			const clampedMouseX = Math.max(
				0,
				Math.min(timelineContentWidth, relativeMouseX),
			);

			const rawTimeSeconds = Math.max(
				0,
				Math.min(
					duration / TICKS_PER_SECOND,
					clampedMouseX / (BASE_TIMELINE_PIXELS_PER_SECOND * zoomLevel),
				),
			);
			const rawTime = Math.round(rawTimeSeconds * TICKS_PER_SECOND);

			const rate = activeProject.settings.fps;
			const frameTime =
				snappedSeekTime({ time: rawTime, duration, rate }) ?? rawTime;

			const shouldSnap = snappingEnabled && !isShiftHeldRef.current;
			const time = (() => {
				if (!shouldSnap) return frameTime;
				const snapPoints = findSnapPoints({
					tracks: activeScene.tracks,
					playheadTime: frameTime,
					bookmarks: activeScene.bookmarks ?? [],
					enablePlayheadSnapping: false,
				});
				const snapResult = snapToNearestPoint({
					targetTime: frameTime,
					snapPoints,
					zoomLevel,
				});
				return snapResult.snapPoint ? snapResult.snappedTime : frameTime;
			})();

			scrubTimeRef.current = time;
			seek({ time });

			lastMouseXRef.current = event.clientX;
		},
		[
			duration,
			zoomLevel,
			seek,
			rulerRef,
			activeProject.settings.fps,
			activeScene,
			isShiftHeldRef,
		],
	);

	const handlePlayheadMouseDown = useCallback(
		({ event }: { event: React.MouseEvent }) => {
			event.preventDefault();
			event.stopPropagation();
			editor.playback.setScrubbing({ isScrubbing: true });
			handleScrub({ event });
		},
		[handleScrub, editor.playback],
	);

	const handleRulerMouseDown = useCallback(
		({ event }: { event: React.MouseEvent }) => {
			if (event.button !== 0) return;
			if (playheadRef?.current?.contains(event.target as Node)) return;

			event.preventDefault();
			pendingRulerScrubRef.current = {
				startX: event.clientX,
				startY: event.clientY,
			};
			isDraggingRulerRef.current = false;
			hasDraggedRulerRef.current = false;
		},
		[playheadRef],
	);

	const handlePlayheadMouseDownEvent = useCallback(
		(event: React.MouseEvent) => handlePlayheadMouseDown({ event }),
		[handlePlayheadMouseDown],
	);

	const handleRulerMouseDownEvent = useCallback(
		(event: React.MouseEvent) => handleRulerMouseDown({ event }),
		[handleRulerMouseDown],
	);

	useEdgeAutoScroll({
		isActive: isScrubbing,
		getMouseClientX: () => lastMouseXRef.current,
		rulerScrollRef,
		tracksScrollRef,
		contentWidth: timelineTimeToPixels({ time: duration, zoomLevel }),
	});

	useEffect(() => {
		const handleMouseMove = ({ event }: { event: MouseEvent }) => {
			if (pendingRulerScrubRef.current && !isScrubbingRef.current) {
				const deltaX = Math.abs(
					event.clientX - pendingRulerScrubRef.current.startX,
				);
				const deltaY = Math.abs(
					event.clientY - pendingRulerScrubRef.current.startY,
				);

				if (deltaY > 6 && deltaY > deltaX) {
					pendingRulerScrubRef.current = null;
					return;
				}

				if (deltaX > 4 || deltaY > 4) {
					pendingRulerScrubRef.current = null;
					isDraggingRulerRef.current = true;
					hasDraggedRulerRef.current = true;
					editor.playback.setScrubbing({ isScrubbing: true });
					handleScrub({ event, snappingEnabled: false });
					return;
				}
			}

			if (!isScrubbingRef.current) return;

			handleScrub({ event });
			if (isDraggingRulerRef.current) {
				hasDraggedRulerRef.current = true;
			}
		};

		const handleMouseUp = ({ event }: { event: MouseEvent }) => {
			if (pendingRulerScrubRef.current) {
				pendingRulerScrubRef.current = null;
				handleScrub({ event, snappingEnabled: false });
				return;
			}

			if (!isScrubbingRef.current) return;

			editor.playback.setScrubbing({ isScrubbing: false });
			const finalTime = scrubTimeRef.current;
			if (finalTime !== null) {
				seek({ time: finalTime });
				editor.project.setTimelineViewState({
					viewState: {
						zoomLevel,
						scrollLeft: tracksScrollRef.current?.scrollLeft ?? 0,
						playheadTime: finalTime,
					},
				});
			}
			scrubTimeRef.current = null;

			if (isDraggingRulerRef.current) {
				isDraggingRulerRef.current = false;
				if (!hasDraggedRulerRef.current) {
					handleScrub({ event, snappingEnabled: false });
				}
				hasDraggedRulerRef.current = false;
			}
		};

		const onMouseMove = (event: MouseEvent) => handleMouseMove({ event });
		const onMouseUp = (event: MouseEvent) => handleMouseUp({ event });

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);

		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, [handleScrub, editor, tracksScrollRef, zoomLevel, seek]);

	const updatePlayheadLeft = useCallback(
		(time: number) => {
			const playheadEl = playheadRef?.current;
			if (!playheadEl) return;
			const centerPosition = timelineTimeToSnappedPixels({
				time,
				zoomLevel: zoomLevelRef.current,
			});
			const leftPosition = getCenteredLineLeft({ centerPixel: centerPosition });
			const scrollLeft = rulerScrollRef.current?.scrollLeft ?? 0;
			playheadEl.style.left = `${leftPosition - scrollLeft}px`;
		},
		[playheadRef, rulerScrollRef],
	);

	useEffect(() => {
		const scrollEl = rulerScrollRef.current;
		if (!scrollEl) return;

		const handleScroll = () => {
			updatePlayheadLeft(editor.playback.getCurrentTime());
		};

		scrollEl.addEventListener("scroll", handleScroll, { passive: true });
		return () => scrollEl.removeEventListener("scroll", handleScroll);
	}, [editor.playback, rulerScrollRef, updatePlayheadLeft]);

	useEffect(() => {
		const handlePlaybackUpdate = (e: Event) => {
			const time = (e as CustomEvent<{ time: number }>).detail.time;
			updatePlayheadLeft(time);

			if (!isPlayingRef.current || isScrubbingRef.current) return;
			const rulerViewport = rulerScrollRef.current;
			const tracksViewport = tracksScrollRef.current;
			if (!rulerViewport || !tracksViewport) return;

			const playheadPixels = timelineTimeToPixels({
				time,
				zoomLevel: zoomLevelRef.current,
			});
			const viewportWidth = rulerViewport.clientWidth;
			const scrollMinimum = 0;
			const scrollMaximum = rulerViewport.scrollWidth - viewportWidth;

			const needsScroll =
				playheadPixels < rulerViewport.scrollLeft ||
				playheadPixels > rulerViewport.scrollLeft + viewportWidth;

			if (needsScroll) {
				const desiredScroll = Math.max(
					scrollMinimum,
					Math.min(scrollMaximum, playheadPixels - viewportWidth / 2),
				);
				rulerViewport.scrollLeft = tracksViewport.scrollLeft = desiredScroll;
			}
		};

		const initialTime = editor.playback.getCurrentTime();
		handlePlaybackUpdate({
			detail: { time: initialTime },
		} as CustomEvent<{ time: number }>);

		window.addEventListener("playback-update", handlePlaybackUpdate);
		window.addEventListener("playback-seek", handlePlaybackUpdate);
		return () => {
			window.removeEventListener("playback-update", handlePlaybackUpdate);
			window.removeEventListener("playback-seek", handlePlaybackUpdate);
		};
	}, [editor.playback, rulerScrollRef, tracksScrollRef, updatePlayheadLeft]);

	return {
		handlePlayheadMouseDown: handlePlayheadMouseDownEvent,
		handleRulerMouseDown: handleRulerMouseDownEvent,
	};
}
