import type { TextElement } from "@/lib/timeline";
import { buildCaptionChunks } from "@/lib/transcription/caption";
import type { TranscriptionWord } from "@/lib/transcription/types";
import type { CaptionChunkMode } from "./types";

export function extractCaptionWords({
	elements,
	ticksPerSecond,
}: {
	elements: TextElement[];
	ticksPerSecond: number;
}): TranscriptionWord[] {
	return elements
		.slice()
		.sort((a, b) => a.startTime - b.startTime)
		.flatMap((element) => {
			const timings = element.captionStyle?.wordTimings ?? [];
			if (timings.length > 0) {
				const elementStartSeconds = element.startTime / ticksPerSecond;
				return timings.map((timing) => ({
					text: timing.word,
					start: elementStartSeconds + timing.start,
					end: elementStartSeconds + timing.end,
				}));
			}

			const words = element.content.split(/\s+/).filter(Boolean);
			if (words.length === 0) {
				return [];
			}

			const elementStartSeconds = element.startTime / ticksPerSecond;
			const elementDurationSeconds = element.duration / ticksPerSecond;
			const wordDuration = elementDurationSeconds / words.length;
			return words.map((word, index) => ({
				text: word,
				start: elementStartSeconds + index * wordDuration,
				end: elementStartSeconds + (index + 1) * wordDuration,
			}));
		});
}

export function rechunkCaptionElements({
	elements,
	chunkMode,
	ticksPerSecond,
}: {
	elements: TextElement[];
	chunkMode: CaptionChunkMode;
	ticksPerSecond: number;
}) {
	const words = extractCaptionWords({ elements, ticksPerSecond });
	if (words.length === 0) {
		return [];
	}
	return buildCaptionChunks({
		segments: [],
		words,
		chunkMode,
	});
}
