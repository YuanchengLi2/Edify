import type {
	CaptionChunk,
	TranscriptionSegment,
	TranscriptionWord,
	WordTiming,
} from "@/lib/transcription/types";
import {
	DEFAULT_WORDS_PER_CAPTION,
	MIN_CAPTION_DURATION_SECONDS,
} from "@/lib/transcription/caption-defaults";
import type { CaptionChunkMode } from "@/lib/captions/types";

const STRONG_SILENCE_GAP_SECONDS = 0.45;
const SOFT_SILENCE_GAP_SECONDS = 0.25;
const HARD_MAX_DURATION_SECONDS = 2.4;
const SOFT_MAX_DURATION_SECONDS = 1.8;

function getChunkLimits(mode: CaptionChunkMode) {
	switch (mode) {
		case "single":
			return {
				hardMaxWords: 1,
				softTargetWords: 1,
				hardMaxDuration: 1.0,
				softMaxDuration: 0.8,
			};
		case "short":
			return {
				hardMaxWords: 3,
				softTargetWords: 2,
				hardMaxDuration: 1.5,
				softMaxDuration: 1.2,
			};
		default:
			return {
				hardMaxWords: 6,
				softTargetWords: 5,
				hardMaxDuration: HARD_MAX_DURATION_SECONDS,
				softMaxDuration: SOFT_MAX_DURATION_SECONDS,
			};
	}
}

export function buildCaptionChunks({
	segments,
	words,
	wordsPerChunk = DEFAULT_WORDS_PER_CAPTION,
	minDuration = MIN_CAPTION_DURATION_SECONDS,
	chunkMode = "sentence",
}: {
	segments: TranscriptionSegment[];
	words?: TranscriptionWord[];
	wordsPerChunk?: number;
	minDuration?: number;
	chunkMode?: CaptionChunkMode;
}): CaptionChunk[] {
	if (words && words.length > 0) {
		return buildChunksFromWords(words, minDuration, chunkMode);
	}
	return buildChunksFromSegments(
		segments,
		wordsPerChunk,
		minDuration,
		chunkMode,
	);
}

function buildChunksFromWords(
	allWords: TranscriptionWord[],
	minDuration: number,
	chunkMode: CaptionChunkMode,
): CaptionChunk[] {
	const captions: CaptionChunk[] = [];
	let startIndex = 0;
	const limits = getChunkLimits(chunkMode);

	for (let index = 1; index <= allWords.length; index++) {
		const currentGroup = allWords.slice(startIndex, index);
		const firstWord = currentGroup[0];
		const lastWord = currentGroup.at(-1);
		if (!firstWord || !lastWord) {
			continue;
		}
		const currentDuration = lastWord.end - firstWord.start;
		const nextWord = allWords[index];

		if (
			nextWord &&
			!shouldBreakWordChunk({
				currentGroup,
				nextWord,
				currentDuration,
				limits,
			})
		) {
			continue;
		}

		captions.push(
			buildWordCaptionChunk({
				wordGroup: currentGroup,
				minDuration,
				nextChunkStart: nextWord?.start,
			}),
		);
		startIndex = index;
	}

	return captions;
}

function shouldBreakWordChunk({
	currentGroup,
	nextWord,
	currentDuration,
	limits,
}: {
	currentGroup: TranscriptionWord[];
	nextWord: TranscriptionWord;
	currentDuration: number;
	limits: ReturnType<typeof getChunkLimits>;
}): boolean {
	const currentWord = currentGroup.at(-1);
	if (!currentWord) return false;

	const gap = nextWord.start - currentWord.end;
	const currentText = currentWord.text.trim();
	const hasSentencePunctuation = /[.!?]["')\]]*$/.test(currentText);
	const hasSoftPunctuation = /[,;:]["')\]]*$/.test(currentText);

	if (currentGroup.length >= limits.hardMaxWords) return true;
	if (currentDuration >= limits.hardMaxDuration) return true;
	if (gap >= STRONG_SILENCE_GAP_SECONDS) return true;
	if (hasSentencePunctuation) return true;
	if (hasSoftPunctuation && currentGroup.length >= 2) return true;
	if (gap >= SOFT_SILENCE_GAP_SECONDS && currentGroup.length >= 2) return true;
	if (
		currentGroup.length >= limits.softTargetWords &&
		currentDuration >= limits.softMaxDuration
	) {
		return true;
	}

	return false;
}

function buildWordCaptionChunk({
	wordGroup,
	minDuration,
	nextChunkStart,
}: {
	wordGroup: TranscriptionWord[];
	minDuration: number;
	nextChunkStart?: number;
}): CaptionChunk {
	const firstWord = wordGroup[0];
	const lastWord = wordGroup.at(-1);
	if (!firstWord || !lastWord) {
		return {
			text: "",
			startTime: 0,
			duration: minDuration,
			wordTimings: [],
		};
	}

	const chunkStart = firstWord.start;
	const rawEnd = lastWord.end;
	const rawDuration = rawEnd - chunkStart;
	const desiredDuration = Math.max(minDuration, rawDuration);
	const chunkDuration =
		nextChunkStart === undefined
			? desiredDuration
			: Math.min(
					desiredDuration,
					Math.max(rawDuration, nextChunkStart - chunkStart),
				);
	const wordTimings: WordTiming[] = wordGroup.map((word) => ({
		word: word.text,
		start: Math.max(0, word.start - chunkStart),
		end: Math.min(chunkDuration, word.end - chunkStart),
	}));

	return {
		text: wordGroup.map((word) => word.text).join(" "),
		startTime: chunkStart,
		duration: chunkDuration,
		wordTimings,
	};
}

function buildChunksFromSegments(
	segments: TranscriptionSegment[],
	_wordsPerChunk: number,
	minDuration: number,
	chunkMode: CaptionChunkMode,
): CaptionChunk[] {
	const limits = getChunkLimits(chunkMode);
	const captions: CaptionChunk[] = [];

	for (const segment of segments) {
		const fragments = splitSegmentIntoFragments({
			text: segment.text,
			targetSize: limits.softTargetWords,
			maxSize: limits.hardMaxWords,
		});
		if (fragments.length === 0) continue;

		const totalWords = fragments.reduce(countWordsInFragment, 0);
		if (totalWords === 0) continue;

		let cursor = segment.start;
		for (const fragment of fragments) {
			const wordCount = countWordsInFragment(0, fragment);
			if (wordCount === 0) continue;

			const proportionalDuration =
				((segment.end - segment.start) * wordCount) / totalWords;
			const duration = Math.min(
				Math.max(minDuration, proportionalDuration),
				limits.hardMaxDuration,
			);
			const words = fragment.split(/\s+/).filter((word) => word.length > 0);
			const wordDuration = duration / words.length;

			captions.push({
				text: fragment,
				startTime: cursor,
				duration,
				wordTimings: words.map((word, index) => ({
					word,
					start: index * wordDuration,
					end: Math.min(duration, (index + 1) * wordDuration),
				})),
			});

			cursor += duration;
		}
	}

	return captions;
}

function splitSegmentIntoFragments({
	text,
	targetSize,
	maxSize,
}: {
	text: string;
	targetSize: number;
	maxSize: number;
}): string[] {
	const normalized = text.trim().replace(/\s+/g, " ");
	if (!normalized) return [];

	const sentenceFragments = normalized.match(/[^.!?]+[.!?]?/g) ?? [normalized];
	const phrases = sentenceFragments.flatMap((fragment) => {
		const trimmed = fragment.trim();
		if (!trimmed) return [];
		const parts = trimmed.split(/(?<=[,;:])\s+/);
		return parts.flatMap((part) => splitWordsGreedy(part, targetSize, maxSize));
	});

	return phrases.filter((fragment) => fragment.length > 0);
}

function splitWordsGreedy(
	text: string,
	targetSize: number,
	maxSize: number,
): string[] {
	const words = text.split(/\s+/).filter((word) => word.length > 0);
	if (words.length <= maxSize) return [words.join(" ")];

	const fragments: string[] = [];
	for (let index = 0; index < words.length; index += targetSize) {
		fragments.push(words.slice(index, index + targetSize).join(" "));
	}
	return fragments;
}

function countWordsInFragment(total: number, fragment: string): number {
	return total + fragment.split(/\s+/).filter((word) => word.length > 0).length;
}
