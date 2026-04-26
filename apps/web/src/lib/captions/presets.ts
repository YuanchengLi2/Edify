import type { CaptionPreset } from "./types";

const noBg = { enabled: false, color: "#000000" } as const;
const center = "center" as const;
const bold = "bold" as const;

export const CAPTION_PRESETS: CaptionPreset[] = [
	// ─────────────────────────────────────────────────────────────────
	// STYLE #1: Bold Outline / "The Classic"
	// Extra-bold white text, thick black stroke, no background.
	// Word pop-in bounce. Category: Basic / Trending.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "pop-bold-outline",
		name: "Bold Outline",
		category: "popup-1",
		chunkMode: "single",
		style: {
			fontFamily: "Anton",
			fontSize: 12,
			color: "#ffffff",
			highlightColor: "#ffffff",
			background: noBg,
			strokeColor: "#000000",
			strokeWidth: 4,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 1,
			lineHeight: 0.95,
			highlightMode: "word",
			wordAnimation: "popup",
			wordAnimationDuration: 0.1,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #2: Yellow on Black / "Most Readable"
	// Bright yellow text on solid black pill/rect background box.
	// Category: Trending / Basic.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "chunk-yellow-black",
		name: "Yellow on Black",
		category: "popup-short",
		chunkMode: "short",
		style: {
			fontFamily: "Poppins",
			fontSize: 9,
			color: "#FFE000",
			highlightColor: "#ffffff",
			background: { enabled: true, color: "#000000", cornerRadius: 6 },
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 0,
			lineHeight: 1.1,
			highlightMode: "word",
			wordAnimation: "fade",
			wordAnimationDuration: 0.2,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #3: Active Word Highlight / "Karaoke"
	// Full sentence shown. Active word changes to bright accent color.
	// Past/future words grey/dimmed. Category: Trending / Highlight.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-karaoke-highlight",
		name: "Karaoke Highlight",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Poppins",
			fontSize: 7,
			color: "#555555",
			highlightColor: "#00D4FF",
			background: noBg,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 0,
			lineHeight: 1.2,
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #4: Neon Glow
	// Text glows from inside — bright cyan/pink, soft light bloom,
	// dark bg needed. All caps, wide spacing. Category: Glow.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "pop-neon-glow",
		name: "Neon Glow",
		category: "popup-1",
		chunkMode: "single",
		style: {
			fontFamily: "Bebas Neue",
			fontSize: 13,
			color: "#00D4FF",
			highlightColor: "#00ffcc",
			background: noBg,
			strokeColor: "#00D4FF44",
			strokeWidth: 6,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 3,
			lineHeight: 0.94,
			highlightMode: "word",
			wordAnimation: "fade",
			wordAnimationDuration: 0.3,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #5: Checksub Original / Gen Z Rose-Violet
	// Rose-violet bold text on black bg with soft radial highlight.
	// Category: Trending.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "chunk-rose-violet",
		name: "Gen Z Rose-Violet",
		category: "popup-short",
		chunkMode: "short",
		style: {
			fontFamily: "Montserrat",
			fontSize: 9,
			color: "#C77DFF",
			highlightColor: "#FF69B4",
			background: { enabled: true, color: "#000000", cornerRadius: 8 },
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 1,
			lineHeight: 1.1,
			highlightMode: "word",
			wordAnimation: "pop",
			wordAnimationDuration: 0.14,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #6: The Eccentric / Blue Serif on Radial Black
	// Bold blue serif text (Lora) on black bg with radial spotlight.
	// Category: Trending.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "chunk-blue-serif",
		name: "Blue Serif / Eccentric",
		category: "popup-short",
		chunkMode: "short",
		style: {
			fontFamily: "Lora",
			fontSize: 9,
			color: "#1565C0",
			highlightColor: "#4488FF",
			background: { enabled: true, color: "#000000", cornerRadius: 0 },
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 0,
			lineHeight: 1.15,
			highlightMode: "word",
			wordAnimation: "fade",
			wordAnimationDuration: 0.3,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #7: The Fancy One / Italic Gradient Bar
	// White italic text on grey linear gradient pill. Lato Italic font.
	// Premium editorial feel. Category: Trending / Aesthetic.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "chunk-fancy-italic",
		name: "Fancy Italic / Gradient Bar",
		category: "popup-short",
		chunkMode: "short",
		style: {
			fontFamily: "Lato",
			fontSize: 9,
			color: "#ffffff",
			highlightColor: "#ffcc44",
			background: { enabled: true, color: "#444444cc", cornerRadius: 10 },
			textAlign: center,
			fontWeight: "normal",
			fontStyle: "italic",
			letterSpacing: 1,
			lineHeight: 1.1,
			highlightMode: "word",
			wordAnimation: "fade",
			wordAnimationDuration: 0.3,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #8: Word-by-Word Pop (MrBeast / Hype Style)
	// One single word at a time, HUGE, bold, bouncy scale animation.
	// White + black outline. Very energetic. Category: Word.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "pop-mrbeast-hype",
		name: "MrBeast Hype Pop",
		category: "popup-1",
		chunkMode: "single",
		style: {
			fontFamily: "Bangers",
			fontSize: 13,
			color: "#ffffff",
			highlightColor: "#FFE000",
			background: noBg,
			strokeColor: "#000000",
			strokeWidth: 4,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 2,
			lineHeight: 0.95,
			highlightMode: "word",
			wordAnimation: "bounce",
			wordAnimationDuration: 0.3,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #9: Frame / Bordered Box
	// Text inside rectangular frame/border. Can be opaque or transparent
	// inside. Structured, geometric. Category: Frame.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-frame-bordered",
		name: "Frame / Bordered Box",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Oswald",
			fontSize: 7,
			color: "#ffffff",
			highlightColor: "#ffdd00",
			background: { enabled: true, color: "#000000cc", cornerRadius: 4 },
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 1,
			lineHeight: 1.2,
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #10: Multiline / Full Sentence Display
	// Longer sentence across 2-3 lines, smaller font. Like traditional
	// subtitles but styled. Fade in as block. Category: Multiline.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-multiline-full",
		name: "Multiline Display",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Inter",
			fontSize: 7,
			color: "#ffffff",
			highlightColor: "#cccccc",
			background: { enabled: true, color: "#000000aa", cornerRadius: 4 },
			textAlign: center,
			fontWeight: "normal",
			letterSpacing: 0,
			lineHeight: 1.3,
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #11: Monoline / Thin Outline Text
	// Clean thin-stroke text, NOT bold. Minimalist, editorial.
	// Lowercase or sentence case. Category: Monoline.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-monoline-thin",
		name: "Monoline Thin",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Inter",
			fontSize: 7,
			color: "#ffffff",
			highlightColor: "#cccccc",
			background: noBg,
			strokeColor: "#ffffff",
			strokeWidth: 0.5,
			textAlign: center,
			fontWeight: "normal",
			letterSpacing: 2,
			lineHeight: 1.2,
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #12: Aesthetic Minimal / Soft Black
	// Understated, clean, lots of breathing room. Soft white on dark.
	// No heavy outlines or boxes. Calm energy. Category: Aesthetic.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-aesthetic-minimal",
		name: "Aesthetic Minimal",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Inter",
			fontSize: 6,
			color: "#e8e8e8",
			highlightColor: "#ffffff",
			background: noBg,
			textAlign: center,
			fontWeight: "normal",
			letterSpacing: 0,
			lineHeight: 1.4,
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #13: Highlight / Red or Yellow Word Emphasis
	// White sentence with one key word highlighted in bright color
	// rectangle behind it. Category: Highlight.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-highlight-box",
		name: "Highlight Emphasis",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Poppins",
			fontSize: 7,
			color: "#ffffff",
			highlightColor: "#FF3131",
			background: noBg,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 0,
			lineHeight: 1.2,
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #14: Gradient Text (No Background)
	// Letters filled with color gradient (fire: red→orange→yellow).
	// No box, no bg. Ultra-bold font. Category: Aesthetic / Trending.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "pop-gradient-text",
		name: "Gradient Text",
		category: "popup-1",
		chunkMode: "single",
		style: {
			fontFamily: "Bebas Neue",
			fontSize: 12,
			color: "#FF3131",
			highlightColor: "#FFE000",
			background: noBg,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 2,
			lineHeight: 0.95,
			highlightMode: "word",
			wordAnimation: "pop",
			wordAnimationDuration: 0.15,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #15: Pastel Soft Italic (Feminine Aesthetic)
	// Italic text in soft warm color (dusty rose/mauve) on pastel bg.
	// Gentle, elegant. Category: Aesthetic.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "chunk-pastel-italic",
		name: "Pastel Soft Italic",
		category: "popup-short",
		chunkMode: "short",
		style: {
			fontFamily: "Lato",
			fontSize: 9,
			color: "#C06080",
			highlightColor: "#A05070",
			background: { enabled: true, color: "#FFE4E1aa", cornerRadius: 10 },
			textAlign: center,
			fontWeight: "normal",
			fontStyle: "italic",
			letterSpacing: 0,
			lineHeight: 1.2,
			highlightMode: "word",
			wordAnimation: "fade",
			wordAnimationDuration: 0.4,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #16: 1-Word HUGE Impact
	// One word taking 80-90% of screen width. Verb or power noun.
	// Max-weight condensed. Slam/elastic bounce. Category: Manual.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "pop-one-word-impact",
		name: "1-Word Huge Impact",
		category: "popup-1",
		chunkMode: "single",
		style: {
			fontFamily: "Bebas Neue",
			fontSize: 14,
			color: "#ffffff",
			highlightColor: "#FF3131",
			background: noBg,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 0,
			lineHeight: 0.9,
			highlightMode: "word",
			wordAnimation: "drop",
			wordAnimationDuration: 0.3,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #17: 2-Word Contrast Stack
	// Two words stacked vertically: small thin label on top, massive
	// heavy word below. Typographic contrast. Category: Manual.
	// Approximated as popup-short with line break styling.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "pop-contrast-stack",
		name: "2-Word Contrast Stack",
		category: "popup-1",
		chunkMode: "single",
		style: {
			fontFamily: "Bebas Neue",
			fontSize: 12,
			color: "#888888",
			highlightColor: "#ffffff",
			background: noBg,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 1,
			lineHeight: 0.9,
			highlightMode: "word",
			wordAnimation: "pop",
			wordAnimationDuration: 0.2,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #18: 3-Part POV / Hook Stack
	// Three layers: tiny label (top), large bold hook (middle),
	// small descriptor (bottom). Staggered fade-in. Category: Manual.
	// Approximated as sentence chunk with mixed emphasis.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-pov-hook-stack",
		name: "3-Part POV Hook",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Inter",
			fontSize: 7,
			color: "#999999",
			highlightColor: "#ffffff",
			background: noBg,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 0,
			lineHeight: 1.3,
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #19: Glitch / RGB Split Text
	// Red ghost offset left, cyan ghost offset right, white center.
	// Chromatic aberration / corrupted look. Category: Glitch animation.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "pop-glitch-rgb",
		name: "Glitch RGB Split",
		category: "popup-1",
		chunkMode: "single",
		style: {
			fontFamily: "Bebas Neue",
			fontSize: 12,
			color: "#ffffff",
			highlightColor: "#00D4FF",
			background: noBg,
			strokeColor: "#FF3131",
			strokeWidth: 2,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 1,
			lineHeight: 1.0,
			highlightMode: "word",
			wordAnimation: "glitch",
			wordAnimationDuration: 0.3,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #20: Lower Third / Name Title Card
	// Professional name/title card. Bold name top, small description
	// bottom. Left-aligned with accent bar. Category: Manual / Template.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-lower-third",
		name: "Lower Third Title",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Inter",
			fontSize: 7,
			color: "#ffffff",
			highlightColor: "#ffffff",
			background: { enabled: true, color: "#000000cc", cornerRadius: 0 },
			textAlign: "left" as const,
			fontWeight: bold,
			letterSpacing: 1,
			lineHeight: 1.2,
			placement: {
				verticalAlign: "bottom",
				marginLeftRatio: 0.08,
				marginRightRatio: 0.28,
				marginVerticalRatio: 0.12,
			},
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #21: Typewriter / Terminal Text
	// Letters appear one at a time. Monospace font. Blinking cursor.
	// Green on black terminal aesthetic. Category: Typewriter animation.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "anim-typewriter",
		name: "Typewriter",
		category: "animated-sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Space Mono",
			fontSize: 7,
			color: "#00E676",
			highlightColor: "#ffffff",
			background: { enabled: true, color: "#000000ee", cornerRadius: 4 },
			textAlign: "left" as const,
			fontWeight: "normal",
			letterSpacing: 0,
			lineHeight: 1.3,
			highlightMode: "word",
			wordAnimation: "typewriter",
			wordAnimationDuration: 0.1,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #22: Stamp / Ink Stamp Text
	// Bold all-caps in thick-bordered rectangle, slightly rotated feel.
	// Red/blue "ink" color. Slams on screen. Category: Manual.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "pop-stamp",
		name: "Stamp",
		category: "popup-1",
		chunkMode: "single",
		style: {
			fontFamily: "Bungee",
			fontSize: 10,
			color: "#CC0000",
			highlightColor: "#ffffff",
			background: noBg,
			strokeColor: "#000000",
			strokeWidth: 4,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 2,
			lineHeight: 0.98,
			highlightMode: "word",
			wordAnimation: "bounce",
			wordAnimationDuration: 0.18,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #23: Frosted Glass Box
	// Semi-transparent frosted/blurred panel. Rounded corners.
	// Premium iOS-like feel. Category: Manual / Glass.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "anim-frosted-glass",
		name: "Frosted Glass Box",
		category: "animated-sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Inter",
			fontSize: 7,
			color: "#ffffff",
			highlightColor: "#99ccff",
			background: { enabled: true, color: "#ffffff18", cornerRadius: 12 },
			textAlign: center,
			fontWeight: "normal",
			letterSpacing: 0,
			lineHeight: 1.2,
			highlightMode: "word",
			wordAnimation: "fade",
			wordAnimationDuration: 0.14,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #24: Pill / Rounded Label
	// Text in fully-rounded pill shape (100% border radius).
	// Solid color fill, high contrast. Category: Manual / Label.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-pill-label",
		name: "Pill Label",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Inter",
			fontSize: 7,
			color: "#ffffff",
			highlightColor: "#000000",
			background: { enabled: true, color: "#FF3131", cornerRadius: 50 },
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 0,
			lineHeight: 1.2,
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #25: Outlined / Hollow Text (Ghost Text)
	// No fill — only outline stroke visible. Video shows through
	// letters. Ultra-bold font needed. Category: Manual / Outline.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-outlined-hollow",
		name: "Outlined Hollow",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Bebas Neue",
			fontSize: 9,
			color: "#00000000",
			highlightColor: "#ffffff",
			background: noBg,
			strokeColor: "#ffffff",
			strokeWidth: 2,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 1,
			lineHeight: 1.1,
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #26: Shadow Stack / 3D Layered Text
	// Ultra-bold text with multiple hard shadows stacked at offsets.
	// White main, red shadow +3px, black shadow +6px. Vintage comic.
	// Category: Manual / Shadow.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "chunk-shadow-stack",
		name: "Shadow Stack 3D",
		category: "popup-short",
		chunkMode: "short",
		style: {
			fontFamily: "Bebas Neue",
			fontSize: 11,
			color: "#ffffff",
			highlightColor: "#ffffff",
			background: noBg,
			strokeColor: "#FF3131",
			strokeWidth: 5,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 1,
			lineHeight: 0.96,
			highlightMode: "word",
			wordAnimation: "drop",
			wordAnimationDuration: 0.2,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #27: iMessage / Chat Bubble
	// Text in rounded speech bubble. Blue sender or grey receiver.
	// Spring bounce appear. Category: Manual / Template.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-chat-bubble",
		name: "Chat Bubble",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Inter",
			fontSize: 7,
			color: "#ffffff",
			highlightColor: "#ffffff",
			background: { enabled: true, color: "#2196F3", cornerRadius: 16 },
			textAlign: "left" as const,
			fontWeight: "normal",
			letterSpacing: 0,
			lineHeight: 1.2,
			placement: {
				verticalAlign: "bottom",
				marginLeftRatio: 0.08,
				marginRightRatio: 0.35,
				marginVerticalRatio: 0.12,
			},
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #28: Retro Terminal / Orange CRT
	// Monospace amber/orange on black. 1980s terminal aesthetic.
	// Prefixed with ">". Typewriter animation. Category: Manual.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "anim-retro-terminal",
		name: "Retro Terminal CRT",
		category: "animated-sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Space Mono",
			fontSize: 7,
			color: "#FF9500",
			highlightColor: "#FFCC00",
			background: { enabled: true, color: "#0a0a0aee", cornerRadius: 2 },
			textAlign: "left" as const,
			fontWeight: "normal",
			letterSpacing: 1,
			lineHeight: 1.2,
			highlightMode: "word",
			wordAnimation: "typewriter",
			wordAnimationDuration: 0.08,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #29: Red Left-Bar Subtitle / News Style
	// Dark semi-transparent bar with red left accent stripe.
	// Left-aligned, sentence case. News chyron feel. Category: Manual.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-red-left-bar",
		name: "Red Left-Bar / News",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Inter",
			fontSize: 7,
			color: "#ffffff",
			highlightColor: "#FF3131",
			background: { enabled: true, color: "#000000aa", cornerRadius: 0 },
			textAlign: "left" as const,
			fontWeight: bold,
			letterSpacing: 0,
			lineHeight: 1.2,
			placement: {
				verticalAlign: "bottom",
				marginLeftRatio: 0.08,
				marginRightRatio: 0.18,
				marginVerticalRatio: 0.1,
			},
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},

	// ─────────────────────────────────────────────────────────────────
	// STYLE #30: Bold + Emoji Internet Caption
	// Bold casual text with black outline, sentence case or lowercase.
	// Emoji inline. Very native internet speech. Category: Auto-Caption.
	// ─────────────────────────────────────────────────────────────────
	{
		id: "sen-bold-emoji",
		name: "Bold + Emoji Internet",
		category: "sentence",
		chunkMode: "sentence",
		style: {
			fontFamily: "Inter",
			fontSize: 8,
			color: "#ffffff",
			highlightColor: "#ffffff",
			background: noBg,
			strokeColor: "#000000",
			strokeWidth: 3,
			textAlign: center,
			fontWeight: bold,
			letterSpacing: 0,
			lineHeight: 1.15,
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	},
];

for (const preset of CAPTION_PRESETS) {
	if (preset.category === "animated-sentence") continue;
	preset.style.wordAnimation = "none";
	preset.style.wordAnimationDuration = 0;
}

export const VISIBLE_CAPTION_PRESET_IDS = CAPTION_PRESETS.map(
	(preset) => preset.id,
);

export const CAPTION_PRESET_CATEGORIES = [
	{ id: "all", label: "All" },
	{ id: "popup-1", label: "1-Word" },
	{ id: "popup-short", label: "2-3 Word" },
	{ id: "sentence", label: "Sentence" },
	{ id: "animated-sentence", label: "Animated" },
] as const;

export type CaptionPresetCategory =
	(typeof CAPTION_PRESET_CATEGORIES)[number]["id"];

export function getCaptionPreset(id: string): CaptionPreset | undefined {
	return CAPTION_PRESETS.find((preset) => preset.id === id);
}

export function getDefaultCaptionPreset(): CaptionPreset {
	return (
		CAPTION_PRESETS.find((preset) => preset.id === "pop-bold-outline") ??
		CAPTION_PRESETS[0]
	);
}
