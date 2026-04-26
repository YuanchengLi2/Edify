import { useState } from "react";
import { usePreviewViewport } from "@/components/editor/panels/preview/preview-viewport";
import {
	usePreviewInteraction,
	type MarqueeRect,
} from "@/hooks/use-preview-interaction";
import type { SnapLine } from "@/lib/preview/preview-snap";
import { TransformHandles } from "./transform-handles";
import { MaskHandles } from "./mask-handles";
import { SnapGuides } from "./snap-guides";
import { TextEditOverlay } from "./text-edit-overlay";
import { usePropertiesStore } from "../properties/stores/properties-store";
import { useEditor } from "@/hooks/use-editor";
import { getDragData } from "@/lib/drag-data";
import { isMaskableElement, type MaskableElement } from "@/lib/timeline";
import { buildDefaultMaskInstance } from "@/lib/masks";
import { appendMask } from "@/lib/masks/active-mask";

function MarqueeOverlay({ rect }: { rect: MarqueeRect }) {
	const viewport = usePreviewViewport();

	const topLeft = viewport.canvasToOverlay({
		canvasX: Math.min(rect.startX, rect.endX),
		canvasY: Math.min(rect.startY, rect.endY),
	});
	const bottomRight = viewport.canvasToOverlay({
		canvasX: Math.max(rect.startX, rect.endX),
		canvasY: Math.max(rect.startY, rect.endY),
	});

	const width = bottomRight.x - topLeft.x;
	const height = bottomRight.y - topLeft.y;

	return (
		<div
			className="pointer-events-none absolute border border-blue-400 bg-blue-400/10"
			style={{
				left: topLeft.x,
				top: topLeft.y,
				width,
				height,
			}}
		/>
	);
}

export function PreviewInteractionOverlay() {
	const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
	const editor = useEditor();
	const viewport = usePreviewViewport();
	const selectedElements = useEditor((e) => e.selection.getSelectedElements());
	const activeTabPerType = usePropertiesStore((s) => s.activeTabPerType);
	const activeMaskByElement = usePropertiesStore((s) => s.activeMaskByElement);
	const setActiveMask = usePropertiesStore((s) => s.setActiveMask);

	const selectedRef =
		selectedElements.length === 1 ? selectedElements[0] : null;
	const activeTrack = selectedRef
		? editor.timeline.getTrackById({ trackId: selectedRef.trackId })
		: null;
	const activeElement =
		activeTrack?.elements.find(
			(element) => element.id === selectedRef?.elementId,
		) ?? null;
	const isMaskMode = activeElement
		? activeTabPerType[activeElement.type] === "masks" &&
			Boolean(
				activeMaskByElement[
					`${selectedRef?.trackId ?? ""}:${selectedRef?.elementId ?? ""}`
				],
			)
		: false;

	const {
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onDoubleClick,
		editingText,
		commitTextEdit,
		marqueeRect,
	} = usePreviewInteraction({
		onSnapLinesChange: setSnapLines,
		isMaskMode,
	});

	const handlePointerDown = (event: React.PointerEvent) => {
		if (viewport.handlePanPointerDown({ event })) {
			return;
		}

		onPointerDown(event);
	};

	const handlePointerMove = (event: React.PointerEvent) => {
		if (viewport.handlePanPointerMove({ event })) {
			return;
		}

		onPointerMove(event);
	};

	const handlePointerUp = (event: React.PointerEvent) => {
		if (viewport.handlePanPointerUp({ event })) {
			return;
		}

		onPointerUp(event);
	};

	const handleDragOver = (event: React.DragEvent) => {
		const dragData = getDragData({ dataTransfer: event.dataTransfer });
		if (dragData?.type !== "mask") return;
		if (!activeElement || !isMaskableElement(activeElement)) return;

		event.preventDefault();
		event.dataTransfer.dropEffect = "copy";
	};

	const handleDrop = (event: React.DragEvent) => {
		const dragData = getDragData({ dataTransfer: event.dataTransfer });
		if (dragData?.type !== "mask") return;
		if (!selectedRef || !activeElement || !isMaskableElement(activeElement))
			return;

		event.preventDefault();
		const nextMask = buildDefaultMaskInstance({
			maskType: dragData.maskType,
			elementSize: undefined,
		});
		const appended = appendMask({
			masks: (activeElement as MaskableElement).masks ?? [],
			mask: nextMask,
		});

		setActiveMask({
			trackId: selectedRef.trackId,
			elementId: selectedRef.elementId,
			maskId: appended.activeMaskId,
		});

		editor.timeline.updateElements({
			updates: [
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					patch: {
						masks: appended.masks,
					} as Partial<MaskableElement>,
				},
			],
		});
	};

	return (
		<div className="absolute inset-0 pointer-events-none select-none">
			<div
				className="absolute inset-0 pointer-events-auto"
				role="application"
				aria-label="Preview canvas"
				style={{
					touchAction: "none",
					cursor: viewport.isPanning
						? "grabbing"
						: viewport.canPan
							? "default"
							: undefined,
				}}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				onDoubleClick={onDoubleClick}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onDragStart={(e) => e.preventDefault()}
			/>
			{editingText ? (
				<TextEditOverlay
					trackId={editingText.trackId}
					elementId={editingText.elementId}
					element={editingText.element}
					onCommit={commitTextEdit}
				/>
			) : isMaskMode ? (
				<MaskHandles onSnapLinesChange={setSnapLines} />
			) : (
				<TransformHandles onSnapLinesChange={setSnapLines} />
			)}
			<SnapGuides lines={snapLines} />
			{marqueeRect && <MarqueeOverlay rect={marqueeRect} />}
		</div>
	);
}
