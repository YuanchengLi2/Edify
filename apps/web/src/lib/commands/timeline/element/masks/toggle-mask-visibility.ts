import { EditorCore } from "@/core";
import { Command, type CommandResult } from "@/lib/commands/base-command";
import { toggleMaskVisibilityInElement } from "@/lib/masks/browser-and-visibility";
import { isMaskableElement, updateElementInSceneTracks } from "@/lib/timeline";
import type { SceneTracks, MaskableElement } from "@/lib/timeline";

export class ToggleMaskVisibilityCommand extends Command {
	private savedState: SceneTracks | null = null;
	private readonly trackId: string;
	private readonly elementId: string;
	private readonly maskId: string;

	constructor({
		trackId,
		elementId,
		maskId,
	}: {
		trackId: string;
		elementId: string;
		maskId: string;
	}) {
		super();
		this.trackId = trackId;
		this.elementId = elementId;
		this.maskId = maskId;
	}

	execute(): CommandResult | undefined {
		const editor = EditorCore.getInstance();
		this.savedState = editor.scenes.getActiveScene().tracks;

		const updatedTracks = updateElementInSceneTracks({
			tracks: this.savedState,
			trackId: this.trackId,
			elementId: this.elementId,
			elementPredicate: isMaskableElement,
			update: (element) =>
				toggleMaskVisibilityInElement({
					element: element as MaskableElement,
					maskId: this.maskId,
				}),
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
