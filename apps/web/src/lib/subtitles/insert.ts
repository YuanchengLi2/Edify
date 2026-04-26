import type { EditorCore } from "@/core";
import {
	AddTrackCommand,
	BatchCommand,
	type Command,
	InsertElementCommand,
	RemoveTrackCommand,
} from "@/lib/commands";
import type { CaptionStyle } from "@/lib/captions/types";
import { buildSubtitleTextElement } from "./build-subtitle-text-element";
import type { SubtitleCue } from "./types";

export function removeExistingCaptionTracks({
	editor,
}: {
	editor: EditorCore;
}): string[] {
	const tracks = editor.scenes.getActiveScene().tracks;
	const textTrackIds = tracks.overlay
		.filter((t) => t.type === "text")
		.map((t) => t.id);
	return textTrackIds;
}

export function insertCaptionChunksAsTextTrack({
	editor,
	captions,
	captionStyle,
	replaceExisting = false,
}: {
	editor: EditorCore;
	captions: SubtitleCue[];
	captionStyle?: CaptionStyle;
	replaceExisting?: boolean;
}): string | null {
	if (captions.length === 0) {
		return null;
	}

	const commands: Command[] = [];

	if (replaceExisting) {
		const existingTrackIds = removeExistingCaptionTracks({ editor });
		for (const trackId of existingTrackIds) {
			commands.push(new RemoveTrackCommand(trackId));
		}
	}

	const addTrackCommand = new AddTrackCommand("text", 0);
	const trackId = addTrackCommand.getTrackId();
	commands.push(addTrackCommand);

	const canvasSize = editor.project.getActive().settings.canvasSize;
	const insertCommands = captions.map((caption, index) => {
		const perCaptionStyle =
			captionStyle && caption.wordTimings?.length
				? {
						...captionStyle,
						wordTimings: caption.wordTimings,
					}
				: captionStyle;
		return new InsertElementCommand({
			placement: { mode: "explicit", trackId },
			element: buildSubtitleTextElement({
				index,
				caption,
				canvasSize,
				captionStyle: perCaptionStyle,
			}),
		});
	});
	commands.push(...insertCommands);

	editor.command.execute({
		command: new BatchCommand(commands),
	});

	return trackId;
}
