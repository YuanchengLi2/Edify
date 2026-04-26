"use client";

import {
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuSeparator,
	ContextMenuItem,
} from "@/components/ui/context-menu";
import { usePreviewViewport } from "@/components/editor/panels/preview/preview-viewport";
import { useEditor } from "@/hooks/use-editor";
import { usePreviewStore } from "@/stores/preview-store";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Delete02Icon,
	ImageFlipHorizontalIcon,
	ImageFlipVerticalIcon,
	RefreshIcon,
	FitToScreenIcon,
} from "@hugeicons/core-free-icons";
import { DEFAULTS } from "@/lib/timeline/defaults";
import type { VisualElement } from "@/lib/timeline";

export function PreviewContextMenu({
	onToggleFullscreen,
	containerRef,
}: {
	onToggleFullscreen: () => void;
	containerRef: React.RefObject<HTMLElement | null>;
}) {
	const editor = useEditor();
	const viewport = usePreviewViewport();
	const { overlays, setOverlayVisibility } = usePreviewStore();

	const selectedElements = editor.selection.getSelectedElements();
	const selectedRef =
		selectedElements.length === 1 ? selectedElements[0] : null;
	const selectedElement = selectedRef
		? (() => {
				const track = editor.timeline.getTrackById({
					trackId: selectedRef.trackId,
				});
				return (
					track?.elements.find((el) => el.id === selectedRef.elementId) ?? null
				);
			})()
		: null;
	const isVisual = selectedElement && "transform" in selectedElement;

	const handleCopySnapshot = async () => {
		const result = await editor.renderer.copySnapshot();
		if (!result.success) {
			toast.error("Failed to copy snapshot", {
				description: result.error ?? "Please try again",
			});
		}
	};

	const handleSaveSnapshot = async () => {
		const result = await editor.renderer.saveSnapshot();
		if (!result.success) {
			toast.error("Failed to save snapshot", {
				description: result.error ?? "Please try again",
			});
		}
	};

	const handleResetTransform = () => {
		if (!selectedRef || !isVisual) return;
		editor.timeline.updateElements({
			updates: [
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					patch: {
						transform: {
							...DEFAULTS.element.transform,
							position: { ...DEFAULTS.element.transform.position },
						},
					},
				},
			],
		});
	};

	const handleFitToCanvas = () => {
		if (!selectedRef || !isVisual) return;
		const el = selectedElement as VisualElement;
		editor.timeline.updateElements({
			updates: [
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					patch: {
						transform: {
							...el.transform,
							scaleX: DEFAULTS.element.transform.scaleX,
							scaleY: DEFAULTS.element.transform.scaleY,
							position: { ...DEFAULTS.element.transform.position },
						},
					},
				},
			],
		});
	};

	const handleFlipHorizontal = () => {
		if (!selectedRef || !isVisual) return;
		const el = selectedElement as VisualElement;
		editor.timeline.updateElements({
			updates: [
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					patch: {
						transform: {
							...el.transform,
							scaleX: -el.transform.scaleX,
						},
					},
				},
			],
		});
	};

	const handleFlipVertical = () => {
		if (!selectedRef || !isVisual) return;
		const el = selectedElement as VisualElement;
		editor.timeline.updateElements({
			updates: [
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					patch: {
						transform: {
							...el.transform,
							scaleY: -el.transform.scaleY,
						},
					},
				},
			],
		});
	};

	const handleDelete = () => {
		if (selectedElements.length === 0) return;
		editor.timeline.deleteElements({ elements: selectedElements });
	};

	return (
		<ContextMenuContent className="w-56" container={containerRef.current}>
			{isVisual && (
				<>
					<ContextMenuItem
						onClick={handleResetTransform}
						icon={<HugeiconsIcon icon={RefreshIcon} />}
						inset
					>
						Reset Transform
					</ContextMenuItem>
					<ContextMenuItem
						onClick={handleFitToCanvas}
						icon={<HugeiconsIcon icon={FitToScreenIcon} />}
						inset
					>
						Fit to Canvas
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						onClick={handleFlipHorizontal}
						icon={<HugeiconsIcon icon={ImageFlipHorizontalIcon} />}
						inset
					>
						Flip Horizontal
					</ContextMenuItem>
					<ContextMenuItem
						onClick={handleFlipVertical}
						icon={<HugeiconsIcon icon={ImageFlipVerticalIcon} />}
						inset
					>
						Flip Vertical
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						onClick={handleDelete}
						icon={<HugeiconsIcon icon={Delete02Icon} />}
						variant="destructive"
						inset
					>
						Delete
					</ContextMenuItem>
					<ContextMenuSeparator />
				</>
			)}
			<ContextMenuItem onClick={viewport.fitToScreen} inset>
				Fit to screen
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuItem onClick={onToggleFullscreen} inset>
				Full screen
			</ContextMenuItem>
			<ContextMenuItem onClick={handleSaveSnapshot} inset>
				Save snapshot
			</ContextMenuItem>
			<ContextMenuItem onClick={handleCopySnapshot} inset>
				Copy snapshot
			</ContextMenuItem>
			<ContextMenuSeparator />
			<ContextMenuCheckboxItem
				checked={overlays.bookmarks}
				onCheckedChange={(checked) =>
					setOverlayVisibility({ overlay: "bookmarks", isVisible: !!checked })
				}
			>
				Show bookmark notes
			</ContextMenuCheckboxItem>
		</ContextMenuContent>
	);
}
