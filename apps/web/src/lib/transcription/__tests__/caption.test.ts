import { describe, expect, test } from "bun:test";
import { buildCaptionChunks } from "@/lib/transcription/caption";
import type {
	TranscriptionSegment,
	TranscriptionWord,
} from "@/lib/transcription/types";

describe("buildCaptionChunks", () => {
	test("splits word-timed captions on strong silence gaps", () => {
		const words: TranscriptionWord[] = [
			{ text: "This", start: 0, end: 0.2 },
			{ text: "is", start: 0.22, end: 0.34 },
			{ text: "fine", start: 0.36, end: 0.6 },
			{ text: "but", start: 1.2, end: 1.36 },
			{ text: "pause", start: 1.38, end: 1.7 },
		];

		const captions = buildCaptionChunks({ segments: [], words });

		expect(captions).toHaveLength(2);
		expect(captions[0]?.text).toBe("This is fine");
		expect(captions[1]?.text).toBe("but pause");
	});

	test("splits word-timed captions on sentence punctuation before hitting hard limits", () => {
		const words: TranscriptionWord[] = [
			{ text: "Wait,", start: 0, end: 0.2 },
			{ text: "this", start: 0.21, end: 0.38 },
			{ text: "works.", start: 0.39, end: 0.7 },
			{ text: "Next", start: 0.74, end: 0.95 },
			{ text: "line", start: 0.96, end: 1.15 },
		];

		const captions = buildCaptionChunks({ segments: [], words });

		expect(captions).toHaveLength(2);
		expect(captions[0]?.text).toBe("Wait, this works.");
		expect(captions[1]?.text).toBe("Next line");
	});

	test("forces one word per chunk in single mode", () => {
		const words: TranscriptionWord[] = [
			{ text: "One", start: 0, end: 0.15 },
			{ text: "word", start: 0.18, end: 0.35 },
			{ text: "at", start: 0.4, end: 0.5 },
			{ text: "a", start: 0.53, end: 0.56 },
			{ text: "time", start: 0.58, end: 0.8 },
		];

		const captions = buildCaptionChunks({
			segments: [],
			words,
			chunkMode: "single",
		});

		expect(captions).toHaveLength(5);
		expect(captions.map((caption) => caption.text)).toEqual([
			"One",
			"word",
			"at",
			"a",
			"time",
		]);
	});

	test("does not create overlapping captions when single-word chunks are shorter than the minimum duration", () => {
		const words: TranscriptionWord[] = [
			{ text: "One", start: 0, end: 0.1 },
			{ text: "two", start: 0.14, end: 0.22 },
			{ text: "three", start: 0.27, end: 0.35 },
		];

		const captions = buildCaptionChunks({
			segments: [],
			words,
			chunkMode: "single",
		});
		const [first, second, third] = captions;

		expect(captions).toHaveLength(3);
		expect(first).toBeDefined();
		expect(second).toBeDefined();
		expect(third).toBeDefined();
		if (!first || !second || !third) {
			throw new Error("Expected three captions");
		}
		expect(first.startTime + first.duration).toBeLessThanOrEqual(
			second.startTime,
		);
		expect(second.startTime + second.duration).toBeLessThanOrEqual(
			third.startTime,
		);
	});

	test("keeps short mode in two-to-three word chunks", () => {
		const words: TranscriptionWord[] = [
			{ text: "This", start: 0, end: 0.12 },
			{ text: "feels", start: 0.13, end: 0.26 },
			{ text: "more", start: 0.28, end: 0.4 },
			{ text: "compact", start: 0.42, end: 0.6 },
			{ text: "now", start: 0.61, end: 0.72 },
		];

		const captions = buildCaptionChunks({
			segments: [],
			words,
			chunkMode: "short",
		});

		expect(captions[0]?.text.split(" ").length).toBeLessThanOrEqual(3);
		expect(
			captions.every((caption) => caption.text.split(" ").length <= 3),
		).toBe(true);
		expect(captions[0]?.text).toBe("This feels more");
	});

	test("keeps sentence mode in sentence-sized chunks", () => {
		const words: TranscriptionWord[] = [
			{ text: "This", start: 0, end: 0.1 },
			{ text: "should", start: 0.12, end: 0.24 },
			{ text: "stay", start: 0.25, end: 0.34 },
			{ text: "as", start: 0.35, end: 0.42 },
			{ text: "one", start: 0.43, end: 0.52 },
			{ text: "sentence", start: 0.53, end: 0.7 },
		];

		const captions = buildCaptionChunks({
			segments: [],
			words,
			chunkMode: "sentence",
		});

		expect(captions).toHaveLength(1);
		expect(captions[0]?.text).toBe("This should stay as one sentence");
		expect(captions[0]?.wordTimings).toHaveLength(6);
	});

	test("falls back to phrase-aware segment chunking without word timings", () => {
		const segments: TranscriptionSegment[] = [
			{
				text: "The quick brown fox jumps, then pauses, then keeps going.",
				start: 0,
				end: 3.6,
			},
		];

		const captions = buildCaptionChunks({ segments });

		expect(captions.length).toBeGreaterThanOrEqual(2);
		expect(captions[0]?.text).toContain("The quick brown fox");
		expect(captions.at(-1)?.text).toContain("keeps going.");
	});
});
