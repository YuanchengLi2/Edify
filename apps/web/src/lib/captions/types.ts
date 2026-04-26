import type { TextBackground, TextElement } from "@/lib/timeline";
import type { SubtitlePlacementStyle } from "@/lib/subtitles/types";

export interface WordTiming {
	word: string;
	start: number;
	end: number;
}

export type CaptionHighlightMode = "word" | "none";

export type CaptionWordAnimation =
	| "none"
	| "fade"
	| "pop"
	| "slide-up"
	| "slide-down"
	| "bounce"
	| "typewriter"
	| "spin"
	| "elastic"
	| "swing"
	| "flip"
	| "glitch"
	| "drop"
	| "popup";

export type CaptionChunkMode = "single" | "short" | "sentence";

export interface CaptionStyle {
	presetId: string | null;
	chunkMode?: CaptionChunkMode;
	category?: CaptionPreset["category"];
	wordTimings: WordTiming[];
	highlightColor: string;
	highlightMode: CaptionHighlightMode;
	wordAnimation?: CaptionWordAnimation;
	wordAnimationDuration?: number;
	wordColorPalette?: string[];
	highlightColorPalette?: string[];
}

export interface CaptionPresetStyle {
	fontFamily: string;
	fontSize?: number;
	color: string;
	highlightColor: string;
	/** Per-word base colors — cycles through the palette across words */
	wordColorPalette?: string[];
	/** Per-word highlight colors — cycles alongside wordColorPalette */
	highlightColorPalette?: string[];
	background: Partial<TextBackground> & { enabled: boolean; color: string };
	strokeColor?: string;
	strokeWidth?: number;
	textAlign: TextElement["textAlign"];
	fontWeight: TextElement["fontWeight"];
	fontStyle?: TextElement["fontStyle"];
	letterSpacing?: number;
	lineHeight?: number;
	placement?: SubtitlePlacementStyle;
	highlightMode: CaptionHighlightMode;
	wordAnimation?: CaptionWordAnimation;
	wordAnimationDuration?: number;
}

export interface CaptionPreset {
	id: string;
	name: string;
	category: "popup-1" | "popup-short" | "sentence" | "animated-sentence";
	chunkMode: CaptionChunkMode;
	style: CaptionPresetStyle;
}
