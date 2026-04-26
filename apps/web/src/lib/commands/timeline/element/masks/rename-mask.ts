import { EditorCore } from "@/core";
import { Command, type CommandResult } from "@/lib/commands/base-command";
import {
	isMaskableElement,
	updateElementInSceneTracks,
} from "@/lib/timeline";
import type { SceneTracks, MaskableElement } from "@/lib/timeline";
import { renameMaskInElement } from "@/lib/masks/naming";

export class RenameMaskCommand extends Command {
	private savedState: SceneTracks | null = null;
	private readonly trackId: string;
	private readonly elementId: string;
	private readonly maskId: string;
	private readonly name: string;

	constructor({
		trackId,
		elementId,
		maskId,
		name,
	}: {
		trackId: string;
		elementId: string;
		maskId: string;
		name: string;
	}) {
		super();
		this.trackId = trackId;
		this.elementId = elementId;
		this.maskId = maskId;
		this.name = name;
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
				renameMaskInElement({
					element: element as MaskableElement,
					maskId: this.maskId,
					name: this.name,
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
