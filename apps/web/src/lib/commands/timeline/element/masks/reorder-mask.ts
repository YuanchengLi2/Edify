import { EditorCore } from "@/core";
import { Command, type CommandResult } from "@/lib/commands/base-command";
import { reorderMasks } from "@/lib/masks/active-mask";
import { isMaskableElement, updateElementInSceneTracks } from "@/lib/timeline";
import type { SceneTracks, MaskableElement } from "@/lib/timeline";

export class ReorderMaskCommand extends Command {
	private savedState: SceneTracks | null = null;
	private readonly trackId: string;
	private readonly elementId: string;
	private readonly fromIndex: number;
	private readonly toIndex: number;

	constructor({
		trackId,
		elementId,
		fromIndex,
		toIndex,
	}: {
		trackId: string;
		elementId: string;
		fromIndex: number;
		toIndex: number;
	}) {
		super();
		this.trackId = trackId;
		this.elementId = elementId;
		this.fromIndex = fromIndex;
		this.toIndex = toIndex;
	}

	execute(): CommandResult | undefined {
		const editor = EditorCore.getInstance();
		this.savedState = editor.scenes.getActiveScene().tracks;

		const updatedTracks = updateElementInSceneTracks({
			tracks: this.savedState,
			trackId: this.trackId,
			elementId: this.elementId,
			elementPredicate: isMaskableElement,
			update: (element) => {
				const reordered = reorderMasks({
					masks: (element as MaskableElement).masks ?? [],
					fromIndex: this.fromIndex,
					toIndex: this.toIndex,
					activeMaskId: null,
				});

				if (!reordered) {
					return element as MaskableElement;
				}

				return {
					...(element as MaskableElement),
					masks: reordered.masks,
				};
			},
		});

		editor.timeline.updateTracks(updatedTracks);
		return undefined;
	}

	undo(): void {
		if (this.savedState) {
			const editor = EditorCore.getInstance();
			editor.timeline.updateTracks(this.savedState);
		}
	}
}
