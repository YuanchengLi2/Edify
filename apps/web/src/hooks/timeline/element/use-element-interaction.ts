import {
	useState,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	type MouseEvent as ReactMouseEvent,
	type RefObject,
} from "react";
import { useEditor } from "@/hooks/use-editor";
import { useShiftKey } from "@/hooks/use-shift-key";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import { BASE_TIMELINE_PIXELS_PER_SECOND } from "@/lib/timeline/scale";
import { TICKS_PER_SECOND } from "@/lib/wasm";
import { TIMELINE_DRAG_THRESHOLD_PX } from "@/components/editor/panels/timeline/interaction";
import { roundToFrame } from "opencut-wasm";
import { computeDropTarget } from "@/components/editor/panels/timeline/drop-target";
import { getMouseTimeFromClientX } from "@/lib/timeline/drag-utils";
import { generateUUID } from "@/utils/id";
import { snapElementEdge, type SnapPoint } from "@/lib/timeline/snap-utils";
import { registerCanceller } from "@/lib/cancel-interaction";
import type {
	DropTarget,
	ElementDragState,
	SceneTracks,
	TimelineElement,
	TimelineTrack,
} from "@/lib/timeline";

interface UseElementInteractionProps {
	zoomLevel: number;
	timelineRef: RefObject<HTMLDivElement | null>;
	tracksContainerRef: RefObject<HTMLDivElement | null>;
	tracksScrollRef: RefObject<HTMLDivElement | null>;
	headerRef?: RefObject<HTMLElement | null>;
	snappingEnabled: boolean;
	onSnapPointChange?: (snapPoint: SnapPoint | null) => void;
}

const MOUSE_BUTTON_RIGHT = 2;

const initialDragState: ElementDragState = {
	isDragging: false,
	elementId: null,
	dragElementIds: [],
	dragTimeOffsets: {},
	trackId: null,
	startMouseX: 0,
	startMouseY: 0,
	startElementTime: 0,
	clickOffsetTime: 0,
	currentTime: 0,
	currentMouseY: 0,
};

interface PendingDragState {
	elementId: string;
	trackId: string;
	startMouseX: number;
	startMouseY: number;
	startElementTime: number;
	clickOffsetTime: number;
}

function getClickOffsetTime({
	clientX,
	elementRect,
	zoomLevel,
}: {
	clientX: number;
	elementRect: DOMRect;
	zoomLevel: number;
}): number {
	const clickOffsetX = clientX - elementRect.left;
	const seconds = clickOffsetX / (BASE_TIMELINE_PIXELS_PER_SECOND * zoomLevel);
	return Math.round(seconds * TICKS_PER_SECOND);
}

function getVerticalDragDirection({
	startMouseY,
	currentMouseY,
}: {
	startMouseY: number;
	currentMouseY: number;
}): "up" | "down" | null {
	if (currentMouseY < startMouseY) return "up";
	if (currentMouseY > startMouseY) return "down";
	return null;
}

function getDragDropTarget({
	clientX,
	clientY,
	elementId,
	trackId,
	tracks,
	tracksContainerRef,
	tracksScrollRef,
	headerRef,
	zoomLevel,
	snappedTime,
	verticalDragDirection,
}: {
	clientX: number;
	clientY: number;
	elementId: string;
	trackId: string;
	tracks: SceneTracks;
	tracksContainerRef: RefObject<HTMLDivElement | null>;
	tracksScrollRef: RefObject<HTMLDivElement | null>;
	headerRef?: RefObject<HTMLElement | null>;
	zoomLevel: number;
	snappedTime: number;
	verticalDragDirection?: "up" | "down" | null;
}): DropTarget | null {
	const containerRect = tracksContainerRef.current?.getBoundingClientRect();
	const scrollContainer = tracksScrollRef.current;
	if (!containerRect || !scrollContainer) return null;

	const sourceTrack = [...tracks.overlay, tracks.main, ...tracks.audio].find(
		({ id }) => id === trackId,
	);
	const movingElement = sourceTrack?.elements.find(
		({ id }) => id === elementId,
	);
	if (!movingElement) return null;

	const elementDuration = movingElement.duration;
	const scrollLeft = scrollContainer.scrollLeft;
	const scrollTop = scrollContainer.scrollTop;
	const scrollContainerRect = scrollContainer.getBoundingClientRect();
	const headerHeight = headerRef?.current?.getBoundingClientRect().height ?? 0;
	const mouseX = clientX - scrollContainerRect.left + scrollLeft;
	const mouseY = clientY - scrollContainerRect.top + scrollTop - headerHeight;

	return computeDropTarget({
		elementType: movingElement.type,
		mouseX,
		mouseY,
		tracks,
		playheadTime: snappedTime,
		isExternalDrop: false,
		elementDuration,
		pixelsPerSecond: BASE_TIMELINE_PIXELS_PER_SECOND,
		zoomLevel,
		startTimeOverride: snappedTime,
		excludeElementId: movingElement.id,
		verticalDragDirection,
	});
}

interface StartDragParams
	extends Omit<
		ElementDragState,
		| "isDragging"
		| "currentTime"
		| "currentMouseY"
		| "dragElementIds"
		| "dragTimeOffsets"
	> {
	initialCurrentTime: number;
	initialCurrentMouseY: number;
}

export function useElementInteraction({
	zoomLevel,
	timelineRef,
	tracksContainerRef,
	tracksScrollRef,
	headerRef,
	snappingEnabled,
	onSnapPointChange,
}: UseElementInteractionProps) {
	const editor = useEditor();
	const isShiftHeldRef = useShiftKey();
	const sceneTracks = useEditor((e) => e.scenes.getActiveScene().tracks);
	const tracks = useMemo(
		() => [...sceneTracks.overlay, sceneTracks.main, ...sceneTracks.audio],
		[sceneTracks],
	);
	const {
		selectedElements,
		isElementSelected,
		selectElement,
		handleElementClick: handleSelectionClick,
	} = useElementSelection();

	const [dragState, setDragState] =
		useState<ElementDragState>(initialDragState);
	const [dragDropTarget, setDragDropTarget] = useState<DropTarget | null>(null);
	const [isPendingDrag, setIsPendingDrag] = useState(false);
	const dragStateRef = useRef<ElementDragState>(initialDragState);
	const isPendingDragRef = useRef(false);
	const pendingDragRef = useRef<PendingDragState | null>(null);
	const lastMouseXRef = useRef(0);
	const mouseDownLocationRef = useRef<{ x: number; y: number } | null>(null);
	const dragFrameRef = useRef<{
		currentTime: number;
		currentMouseY: number;
		dragDropTarget: DropTarget | null;
	} | null>(null);
	const dragFrameRafRef = useRef<number | null>(null);

	useEffect(() => {
		dragStateRef.current = dragState;
	}, [dragState]);

	useEffect(() => {
		isPendingDragRef.current = isPendingDrag;
	}, [isPendingDrag]);

	const flushDragFrame = useCallback(() => {
		dragFrameRafRef.current = null;
		const frame = dragFrameRef.current;
		if (!frame) return;
		dragFrameRef.current = null;

		setDragState((previousDragState) => {
			const nextDragState = {
				...previousDragState,
				currentTime: frame.currentTime,
				currentMouseY: frame.currentMouseY,
			};
			dragStateRef.current = nextDragState;
			return nextDragState;
		});
		setDragDropTarget(frame.dragDropTarget);
	}, []);

	const scheduleDragFrame = useCallback(
		({
			currentTime,
			currentMouseY,
			dragDropTarget,
		}: {
			currentTime: number;
			currentMouseY: number;
			dragDropTarget: DropTarget | null;
		}) => {
			dragFrameRef.current = {
				currentTime,
				currentMouseY,
				dragDropTarget,
			};

			if (dragFrameRafRef.current !== null) return;
			dragFrameRafRef.current = requestAnimationFrame(flushDragFrame);
		},
		[flushDragFrame],
	);

	const startDrag = useCallback(
		({
			elementId,
			trackId,
			startMouseX,
			startMouseY,
			startElementTime,
			clickOffsetTime,
			initialCurrentTime,
			initialCurrentMouseY,
		}: StartDragParams) => {
			const nextDragState = {
				isDragging: true,
				elementId,
				dragElementIds: elementId ? [elementId] : [],
				dragTimeOffsets: {},
				trackId,
				startMouseX,
				startMouseY,
				startElementTime,
				clickOffsetTime,
				currentTime: initialCurrentTime,
				currentMouseY: initialCurrentMouseY,
			};
			dragStateRef.current = nextDragState;
			setDragState(nextDragState);
		},
		[],
	);

	const endDrag = useCallback(() => {
		if (dragFrameRafRef.current !== null) {
			cancelAnimationFrame(dragFrameRafRef.current);
			dragFrameRafRef.current = null;
		}
		dragFrameRef.current = null;
		dragStateRef.current = initialDragState;
		setDragState(initialDragState);
		setDragDropTarget(null);
	}, []);

	const cancelCurrentDrag = useCallback(() => {
		pendingDragRef.current = null;
		mouseDownLocationRef.current = null;
		isPendingDragRef.current = false;
		setIsPendingDrag(false);
		endDrag();
		onSnapPointChange?.(null);
	}, [endDrag, onSnapPointChange]);

	useEffect(() => {
		if (!dragState.isDragging && !isPendingDrag) return;

		return registerCanceller({ fn: cancelCurrentDrag });
	}, [dragState.isDragging, isPendingDrag, cancelCurrentDrag]);

	const getDragSnapResult = useCallback(
		({
			frameSnappedTime,
			movingElement,
		}: {
			frameSnappedTime: number;
			movingElement: TimelineElement | null | undefined;
		}) => {
			const shouldSnap = snappingEnabled && !isShiftHeldRef.current;
			if (!shouldSnap || !movingElement) {
				return { snappedTime: frameSnappedTime, snapPoint: null };
			}

			const elementDuration = movingElement.duration;
			const playheadTime = editor.playback.getCurrentTime();

			const startSnap = snapElementEdge({
				targetTime: frameSnappedTime,
				elementDuration,
				tracks: sceneTracks,
				playheadTime,
				zoomLevel,
				excludeElementId: movingElement.id,
				snapToStart: true,
			});

			const endSnap = snapElementEdge({
				targetTime: frameSnappedTime,
				elementDuration,
				tracks: sceneTracks,
				playheadTime,
				zoomLevel,
				excludeElementId: movingElement.id,
				snapToStart: false,
			});

			const snapResult =
				startSnap.snapDistance <= endSnap.snapDistance ? startSnap : endSnap;
			if (!snapResult.snapPoint) {
				return { snappedTime: frameSnappedTime, snapPoint: null };
			}

			return {
				snappedTime: snapResult.snappedTime,
				snapPoint: snapResult.snapPoint,
			};
		},
		[snappingEnabled, editor.playback, zoomLevel, isShiftHeldRef, sceneTracks],
	);

	useEffect(() => {
		if (!dragState.isDragging && !isPendingDrag) return;

		const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
			const currentDragState = dragStateRef.current;
			let startedDragThisEvent = false;
			const timeline = timelineRef.current;
			const scrollContainer = tracksScrollRef.current;
			if (!timeline || !scrollContainer) return;
			lastMouseXRef.current = clientX;

			if (isPendingDragRef.current && pendingDragRef.current) {
				const deltaX = Math.abs(clientX - pendingDragRef.current.startMouseX);
				const deltaY = Math.abs(clientY - pendingDragRef.current.startMouseY);
				if (
					deltaX > TIMELINE_DRAG_THRESHOLD_PX ||
					deltaY > TIMELINE_DRAG_THRESHOLD_PX
				) {
					const activeProject = editor.project.getActive();
					if (!activeProject) return;
					const scrollLeft = scrollContainer.scrollLeft;
					const mouseTime = getMouseTimeFromClientX({
						clientX,
						containerRect: scrollContainer.getBoundingClientRect(),
						zoomLevel,
						scrollLeft,
					});
					const adjustedTime = Math.max(
						0,
						mouseTime - pendingDragRef.current.clickOffsetTime,
					);
					const snappedTime =
						roundToFrame({
							time: adjustedTime,
							rate: activeProject.settings.fps,
						}) ?? adjustedTime;
					startDrag({
						...pendingDragRef.current,
						initialCurrentTime: snappedTime,
						initialCurrentMouseY: clientY,
					});
					startedDragThisEvent = true;
					pendingDragRef.current = null;
					isPendingDragRef.current = false;
					setIsPendingDrag(false);
				} else {
					return;
				}
			}

			// When drag starts this event, re-read state so position
			// is applied immediately — no one-frame delay.
			const dragStateForPosition = startedDragThisEvent
				? dragStateRef.current
				: currentDragState;

			if (dragStateForPosition.elementId && dragStateForPosition.trackId) {
				const alreadySelected = isElementSelected({
					trackId: dragStateForPosition.trackId,
					elementId: dragStateForPosition.elementId,
				});
				if (!alreadySelected) {
					selectElement({
						trackId: dragStateForPosition.trackId,
						elementId: dragStateForPosition.elementId,
					});
				}
			}

			const activeProject = editor.project.getActive();
			if (!activeProject) return;

			const scrollLeft = scrollContainer.scrollLeft;
			const mouseTime = getMouseTimeFromClientX({
				clientX,
				containerRect: scrollContainer.getBoundingClientRect(),
				zoomLevel,
				scrollLeft,
			});
			const adjustedTime = Math.max(
				0,
				mouseTime - dragStateForPosition.clickOffsetTime,
			);
			const fps = activeProject.settings.fps;
			const frameSnappedTime =
				roundToFrame({ time: adjustedTime, rate: fps }) ?? adjustedTime;

			const sourceTrack = tracks.find(
				({ id }) => id === dragStateForPosition.trackId,
			);
			const movingElement = sourceTrack?.elements.find(
				({ id }) => id === dragStateForPosition.elementId,
			);
			const { snappedTime, snapPoint } = getDragSnapResult({
				frameSnappedTime,
				movingElement,
			});
			onSnapPointChange?.(snapPoint);

			let nextDragDropTarget: DropTarget | null = null;
			if (dragStateForPosition.elementId && dragStateForPosition.trackId) {
				const verticalDragDirection = getVerticalDragDirection({
					startMouseY: dragStateForPosition.startMouseY,
					currentMouseY: clientY,
				});
				nextDragDropTarget = getDragDropTarget({
					clientX,
					clientY,
					elementId: dragStateForPosition.elementId,
					trackId: dragStateForPosition.trackId,
					tracks: sceneTracks,
					tracksContainerRef,
					tracksScrollRef,
					headerRef,
					zoomLevel,
					snappedTime,
					verticalDragDirection,
				});
			}

			scheduleDragFrame({
				currentTime: snappedTime,
				currentMouseY: clientY,
				dragDropTarget: nextDragDropTarget?.isNewTrack
					? nextDragDropTarget
					: null,
			});
		};

		document.addEventListener("mousemove", handleMouseMove);
		return () => document.removeEventListener("mousemove", handleMouseMove);
	}, [
		dragState.isDragging,
		zoomLevel,
		isElementSelected,
		selectElement,
		editor.project,
		timelineRef,
		tracksScrollRef,
		tracksContainerRef,
		headerRef,
		tracks,
		isPendingDrag,
		startDrag,
		getDragSnapResult,
		onSnapPointChange,
		scheduleDragFrame,
		sceneTracks,
	]);

	useEffect(() => {
		if (!dragState.isDragging) return;

		const handleMouseUp = ({ clientX, clientY }: MouseEvent) => {
			const currentDragState = dragStateRef.current;
			if (!currentDragState.elementId || !currentDragState.trackId) return;

			if (mouseDownLocationRef.current) {
				const deltaX = Math.abs(clientX - mouseDownLocationRef.current.x);
				const deltaY = Math.abs(clientY - mouseDownLocationRef.current.y);
				if (
					deltaX <= TIMELINE_DRAG_THRESHOLD_PX &&
					deltaY <= TIMELINE_DRAG_THRESHOLD_PX
				) {
					mouseDownLocationRef.current = null;
					endDrag();
					onSnapPointChange?.(null);
					return;
				}
			}

			const dropTarget = getDragDropTarget({
				clientX,
				clientY,
				elementId: currentDragState.elementId,
				trackId: currentDragState.trackId,
				tracks: sceneTracks,
				tracksContainerRef,
				tracksScrollRef,
				headerRef,
				zoomLevel,
				snappedTime: currentDragState.currentTime,
				verticalDragDirection: getVerticalDragDirection({
					startMouseY: currentDragState.startMouseY,
					currentMouseY: clientY,
				}),
			});
			if (!dropTarget) {
				endDrag();
				onSnapPointChange?.(null);
				return;
			}
			const snappedTime = currentDragState.currentTime;

			const sourceTrack = tracks.find(
				({ id }) => id === currentDragState.trackId,
			);
			if (!sourceTrack) {
				endDrag();
				onSnapPointChange?.(null);
				return;
			}
			const movingElement =
				sourceTrack.elements.find(
					({ id }) => id === currentDragState.elementId,
				) ?? null;
			if (
				movingElement &&
				!dropTarget.isNewTrack &&
				tracks[dropTarget.trackIndex]?.id === currentDragState.trackId &&
				snappedTime === movingElement.startTime
			) {
				endDrag();
				onSnapPointChange?.(null);
				return;
			}

			if (dropTarget.isNewTrack) {
				const newTrackId = generateUUID();

				editor.timeline.moveElement({
					sourceTrackId: currentDragState.trackId,
					targetTrackId: newTrackId,
					elementId: currentDragState.elementId,
					newStartTime: snappedTime,
					createTrack: { type: sourceTrack.type, index: dropTarget.trackIndex },
				});
				selectElement({
					trackId: newTrackId,
					elementId: currentDragState.elementId,
				});
			} else {
				const targetTrack = tracks[dropTarget.trackIndex];
				if (targetTrack) {
					editor.timeline.moveElement({
						sourceTrackId: currentDragState.trackId,
						targetTrackId: targetTrack.id,
						elementId: currentDragState.elementId,
						newStartTime: snappedTime,
					});
					if (targetTrack.id !== currentDragState.trackId) {
						selectElement({
							trackId: targetTrack.id,
							elementId: currentDragState.elementId,
						});
					}
				}
			}

			endDrag();
			onSnapPointChange?.(null);
		};

		document.addEventListener("mouseup", handleMouseUp);
		return () => document.removeEventListener("mouseup", handleMouseUp);
	}, [
		dragState.isDragging,
		zoomLevel,
		tracks,
		endDrag,
		onSnapPointChange,
		editor.timeline,
		tracksContainerRef,
		tracksScrollRef,
		headerRef,
		selectElement,
		sceneTracks,
	]);

	useEffect(() => {
		if (!isPendingDrag) return;

		const handleMouseUp = () => {
			pendingDragRef.current = null;
			isPendingDragRef.current = false;
			setIsPendingDrag(false);
			onSnapPointChange?.(null);
		};

		document.addEventListener("mouseup", handleMouseUp);
		return () => document.removeEventListener("mouseup", handleMouseUp);
	}, [isPendingDrag, onSnapPointChange]);

	const handleElementMouseDown = useCallback(
		({
			event,
			element,
			track,
		}: {
			event: ReactMouseEvent;
			element: TimelineElement;
			track: TimelineTrack;
		}) => {
			const isRightClick = event.button === MOUSE_BUTTON_RIGHT;

			// right-click: don't stop propagation so ContextMenu can open
			if (isRightClick) {
				const alreadySelected = isElementSelected({
					trackId: track.id,
					elementId: element.id,
				});
				if (!alreadySelected) {
					handleSelectionClick({
						trackId: track.id,
						elementId: element.id,
						isMultiKey: false,
					});
				}
				return;
			}

			event.stopPropagation();
			mouseDownLocationRef.current = { x: event.clientX, y: event.clientY };

			const isMultiSelect = event.metaKey || event.ctrlKey || event.shiftKey;

			if (isMultiSelect) {
				handleSelectionClick({
					trackId: track.id,
					elementId: element.id,
					isMultiKey: true,
				});
			}

			const clickOffsetTime = getClickOffsetTime({
				clientX: event.clientX,
				elementRect: event.currentTarget.getBoundingClientRect(),
				zoomLevel,
			});
			pendingDragRef.current = {
				elementId: element.id,
				trackId: track.id,
				startMouseX: event.clientX,
				startMouseY: event.clientY,
				startElementTime: element.startTime,
				clickOffsetTime,
			};
			isPendingDragRef.current = true;
			setIsPendingDrag(true);
		},
		[zoomLevel, isElementSelected, handleSelectionClick],
	);

	const handleElementClick = useCallback(
		({
			event,
			element,
			track,
		}: {
			event: ReactMouseEvent;
			element: TimelineElement;
			track: TimelineTrack;
		}) => {
			event.stopPropagation();

			if (mouseDownLocationRef.current) {
				const deltaX = Math.abs(event.clientX - mouseDownLocationRef.current.x);
				const deltaY = Math.abs(event.clientY - mouseDownLocationRef.current.y);
				if (
					deltaX > TIMELINE_DRAG_THRESHOLD_PX ||
					deltaY > TIMELINE_DRAG_THRESHOLD_PX
				) {
					mouseDownLocationRef.current = null;
					return;
				}
			}

			// modifier keys already handled in mousedown
			if (event.metaKey || event.ctrlKey || event.shiftKey) return;

			const alreadySelected = isElementSelected({
				trackId: track.id,
				elementId: element.id,
			});
			if (!alreadySelected || selectedElements.length > 1) {
				selectElement({ trackId: track.id, elementId: element.id });
				return;
			}

			editor.selection.clearKeyframeSelection();
		},
		[editor.selection, isElementSelected, selectElement, selectedElements],
	);

	return {
		dragState,
		dragDropTarget,
		handleElementMouseDown,
		handleElementClick,
		lastMouseXRef,
	};
}
