import { BaseNode } from "./base-node";
import type { TextElement } from "@/lib/timeline";
import type { EffectPass } from "@/lib/effects/types";
import type { Transform } from "@/lib/rendering";
import { CORNER_RADIUS_MAX, CORNER_RADIUS_MIN } from "@/lib/text/background";
import {
	drawTextDecoration,
	getTextBackgroundRect,
	setCanvasLetterSpacing,
} from "@/lib/text/layout";
import type { MeasuredTextElement } from "@/lib/text/measure-element";
import type {
	CaptionStyle,
	CaptionWordAnimation,
	WordTiming,
} from "@/lib/captions/types";
import { clamp } from "@/utils/math";
import {
	easeOutBack,
	easeOutBounce,
	easeOutCubic,
	easeOutElastic,
} from "@/lib/captions/easing";

export type TextNodeParams = TextElement & {
	elementId: string;
	canvasCenter: { x: number; y: number };
	canvasHeight: number;
	textBaseline?: CanvasTextBaseline;
};

export interface ResolvedTextNodeState {
	transform: Transform;
	opacity: number;
	textColor: string;
	strokeColor: string;
	strokeWidth: number;
	backgroundColor: string;
	effectPasses: EffectPass[][];
	measuredText: MeasuredTextElement;
	localTimeSeconds: number;
	captionStyle?: CaptionStyle;
}

export class TextNode extends BaseNode<TextNodeParams, ResolvedTextNodeState> {}

function drawOutsideTextStroke({
	ctx,
	text,
	y,
	radius,
	color,
}: {
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	text: string;
	y: number;
	radius: number;
	color: string;
}): void {
	if (radius <= 0) return;

	const passes = Math.max(1, Math.round(radius));
	ctx.save();
	ctx.fillStyle = color;

	for (let step = passes; step >= 1; step--) {
		const offset = step;
		ctx.fillText(text, -offset, y);
		ctx.fillText(text, offset, y);
		ctx.fillText(text, 0, y - offset);
		ctx.fillText(text, 0, y + offset);
		ctx.fillText(text, -offset, y - offset);
		ctx.fillText(text, offset, y - offset);
		ctx.fillText(text, -offset, y + offset);
		ctx.fillText(text, offset, y + offset);
	}

	ctx.restore();
}

function findActiveWordIndex({
	wordTimings,
	localTimeSeconds,
}: {
	wordTimings: WordTiming[];
	localTimeSeconds: number;
}): number {
	for (let i = 0; i < wordTimings.length; i++) {
		const wt = wordTimings[i];
		if (localTimeSeconds >= wt.start && localTimeSeconds < wt.end) {
			return i;
		}
	}
	return -1;
}

function findLastActiveWordIndex({
	wordTimings,
	localTimeSeconds,
}: {
	wordTimings: WordTiming[];
	localTimeSeconds: number;
}): number {
	let lastIdx = -1;
	for (let i = 0; i < wordTimings.length; i++) {
		if (localTimeSeconds >= wordTimings[i].start) {
			lastIdx = i;
		}
	}
	return lastIdx;
}

interface WordAnimState {
	opacity: number;
	scale: number;
	offsetX: number;
	offsetY: number;
	rotation: number;
	visibleChars?: number;
}

function computeWordAnimationState({
	localTimeSeconds,
	wordTiming,
	animation,
	duration,
}: {
	localTimeSeconds: number;
	wordTiming: WordTiming;
	animation: CaptionWordAnimation;
	duration: number;
}): WordAnimState {
	if (animation === "none") {
		return { opacity: 1, scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };
	}

	const wordDuration = Math.max(wordTiming.end - wordTiming.start, 0.08);
	const animDuration = Math.max(
		0.08,
		Math.min(duration > 0 ? duration : 0.14, wordDuration * 0.6),
	);
	const timeSinceStart = localTimeSeconds - wordTiming.start;

	if (timeSinceStart < 0) {
		return { opacity: 0.15, scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };
	}

	const raw = Math.min(timeSinceStart / animDuration, 1);

	switch (animation) {
		case "fade":
			return {
				opacity: easeOutCubic(raw),
				scale: 1,
				offsetX: 0,
				offsetY: 0,
				rotation: 0,
			};
		case "pop":
			return {
				opacity: Math.min(raw * 3, 1),
				scale: raw < 1 ? easeOutBack(raw) : 1,
				offsetX: 0,
				offsetY: 0,
				rotation: 0,
			};
		case "slide-up":
			return {
				opacity: Math.min(raw * 3, 1),
				scale: 1,
				offsetX: 0,
				offsetY: (1 - easeOutCubic(raw)) * 0.5,
				rotation: 0,
			};
		case "slide-down":
			return {
				opacity: Math.min(raw * 3, 1),
				scale: 1,
				offsetX: 0,
				offsetY: -(1 - easeOutCubic(raw)) * 0.5,
				rotation: 0,
			};
		case "bounce":
			return {
				opacity: Math.min(raw * 3, 1),
				scale: raw < 1 ? easeOutBounce(raw) : 1,
				offsetX: 0,
				offsetY: 0,
				rotation: 0,
			};
		case "spin":
			return {
				opacity: Math.min(raw * 3, 1),
				scale: raw < 1 ? easeOutBack(Math.min(raw * 1.2, 1)) : 1,
				offsetX: 0,
				offsetY: 0,
				rotation: (1 - easeOutCubic(raw)) * -360,
			};
		case "elastic":
			return {
				opacity: Math.min(raw * 3, 1),
				scale: raw < 1 ? easeOutElastic(raw) : 1,
				offsetX: 0,
				offsetY: 0,
				rotation: 0,
			};
		case "swing":
			return {
				opacity: Math.min(raw * 3, 1),
				scale: 1,
				offsetX: 0,
				offsetY: 0,
				rotation: (1 - easeOutCubic(raw)) * -45,
			};
		case "flip":
			return {
				opacity: Math.min(raw * 3, 1),
				scale: raw < 1 ? easeOutBack(raw) : 1,
				offsetX: 0,
				offsetY: 0,
				rotation: raw < 1 ? (1 - raw) * -180 : 0,
			};
		case "glitch": {
			const jitterX = raw < 1 ? (Math.random() - 0.5) * 0.15 : 0;
			const glitchOpacity = raw < 0.3 ? raw * 3.33 : 1;
			return {
				opacity: glitchOpacity,
				scale: 1,
				offsetX: jitterX,
				offsetY: raw < 1 ? (Math.random() - 0.5) * 0.1 : 0,
				rotation: 0,
			};
		}
		case "drop":
			return {
				opacity: Math.min(raw * 4, 1),
				scale: raw < 1 ? easeOutBounce(raw) : 1,
				offsetX: 0,
				offsetY: -(1 - easeOutBounce(raw)) * 0.8,
				rotation: 0,
			};
		case "typewriter": {
			const charProgress = raw * wordTiming.word.length;
			const visibleChars = Math.floor(charProgress);
			const charFrac = charProgress - visibleChars;
			return {
				opacity: visibleChars >= wordTiming.word.length ? 1 : charFrac,
				scale: 1,
				offsetX: 0,
				offsetY: 0,
				rotation: 0,
				visibleChars,
			};
		}
		default:
			return { opacity: 1, scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };
	}
}

function renderPopupWord({
	ctx,
	captionStyle,
	activeWordIdx,
	highlightColor,
	fontString,
	letterSpacing,
	block,
	localTimeSeconds,
}: {
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	captionStyle: CaptionStyle;
	activeWordIdx: number;
	scaledFontSize: number;
	strokeRadius: number;
	strokeColor: string;
	defaultColor: string;
	highlightColor: string;
	wordColorPalette?: string[];
	highlightColorPalette?: string[];
	fontString: string;
	letterSpacing: number;
	lines: string[];
	lineMetrics: TextMetrics[];
	block: { visualCenterOffset: number };
	localTimeSeconds: number;
}): void {
	const wordTimings = captionStyle.wordTimings;
	if (activeWordIdx < 0 || activeWordIdx >= wordTimings.length) return;

	const activeTiming = wordTimings[0];
	const word = activeTiming.word;
	if (!word) return;

	const animDuration =
		(captionStyle.wordAnimationDuration ?? 0.12) > 0
			? (captionStyle.wordAnimationDuration ?? 0.12)
			: 0.12;
	const activeWordDuration = Math.max(
		0.06,
		(activeTiming.end ?? activeTiming.start) - activeTiming.start,
	);
	const resolvedAnimDuration = Math.min(animDuration, activeWordDuration);

	const centerY = -block.visualCenterOffset;

	ctx.save();
	ctx.font = fontString;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	setCanvasLetterSpacing({ ctx, letterSpacingPx: letterSpacing });

	const elapsed = localTimeSeconds - activeTiming.start;
	const raw = Math.min(Math.max(elapsed / resolvedAnimDuration, 0), 1);
	const scaleVal = raw < 1 ? 1 + (1 - easeOutBack(raw)) * 0.5 : 1;
	const opacity = raw < 0.15 ? raw / 0.15 : 1;

	ctx.save();
	ctx.translate(0, centerY);
	ctx.scale(scaleVal, scaleVal);
	ctx.globalAlpha = opacity;

	ctx.fillStyle = highlightColor;
	ctx.fillText(word, 0, 0);

	ctx.restore();
	ctx.restore();
}

function renderKaraokeLine({
	ctx,
	line,
	lineY,
	lineWidth,
	scaledFontSize,
	textAlign,
	strokeRadius,
	strokeColor,
	defaultColor,
	highlightColor,
	activeWordIndex,
	textDecoration,
	metrics,
	wordsInLine,
	globalWordOffset,
	wordTimings,
	localTimeSeconds,
	wordAnimation,
	wordAnimationDuration,
	revealFutureWords,
}: {
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	line: string;
	lineY: number;
	lineWidth: number;
	scaledFontSize: number;
	textAlign: CanvasTextAlign;
	strokeRadius: number;
	strokeColor: string;
	defaultColor: string;
	highlightColor: string;
	wordColorPalette?: string[];
	highlightColorPalette?: string[];
	activeWordIndex: number;
	textDecoration: string;
	metrics: TextMetrics;
	wordsInLine: string[];
	globalWordOffset: number;
	wordTimings: WordTiming[];
	localTimeSeconds: number;
	wordAnimation: CaptionWordAnimation;
	wordAnimationDuration: number;
	revealFutureWords: boolean;
}): void {
	if (wordsInLine.length === 0) {
		ctx.fillStyle = defaultColor;
		ctx.fillText(line, 0, lineY);
		return;
	}

	let startX = 0;
	if (textAlign === "center") startX = -lineWidth / 2;
	if (textAlign === "right") startX = -lineWidth;

	const spaceWidth = ctx.measureText(" ").width;
	let cursorX = startX;

	for (let w = 0; w < wordsInLine.length; w++) {
		const globalIdx = globalWordOffset + w;
		const word = wordsInLine[w];
		const isHighlighted = globalIdx === activeWordIndex;
		const wordWidth = ctx.measureText(word).width;
		const wt = wordTimings[globalIdx];

		const hasAnimation = wordAnimation !== "none" && wt;

		let wordOpacity = 1;
		let wordScale = 1;
		let wordOffsetX = 0;
		let wordOffsetY = 0;
		let wordRotation = 0;
		let visibleChars = word.length;

		if (hasAnimation) {
			const anim = computeWordAnimationState({
				localTimeSeconds,
				wordTiming: wt,
				animation: wordAnimation,
				duration: wordAnimationDuration,
			});
			wordOpacity = anim.opacity;
			wordScale = anim.scale;
			wordOffsetX = anim.offsetX * scaledFontSize;
			wordOffsetY = anim.offsetY * scaledFontSize;
			wordRotation = anim.rotation;
			if (anim.visibleChars !== undefined) {
				visibleChars = anim.visibleChars;
			}
		}

		const preActive =
			revealFutureWords && localTimeSeconds < (wt?.start ?? Infinity);
		const dimmedOpacity = preActive ? 0 : wordOpacity;

		ctx.save();
		ctx.textAlign = "left";

		if (
			wordScale !== 1 ||
			wordOffsetX !== 0 ||
			wordOffsetY !== 0 ||
			wordRotation !== 0
		) {
			const centerX = cursorX + wordWidth / 2;
			const centerY = lineY;
			ctx.translate(centerX, centerY);
			if (wordRotation !== 0) {
				ctx.rotate((wordRotation * Math.PI) / 180);
			}
			ctx.scale(wordScale, wordScale);
			ctx.translate(-centerX, -centerY);
			ctx.translate(wordOffsetX, wordOffsetY);
		}

		if (dimmedOpacity < 1) {
			ctx.globalAlpha = dimmedOpacity;
		}

		const displayWord =
			wordAnimation === "typewriter" && visibleChars < word.length
				? word.substring(0, Math.max(1, visibleChars))
				: word;

		if (strokeRadius > 0 && strokeColor) {
			ctx.save();
			ctx.fillStyle = strokeColor;
			const passes = Math.max(1, Math.round(strokeRadius));
			for (let step = passes; step >= 1; step--) {
				ctx.fillText(displayWord, cursorX - step, lineY);
				ctx.fillText(displayWord, cursorX + step, lineY);
				ctx.fillText(displayWord, cursorX, lineY - step);
				ctx.fillText(displayWord, cursorX, lineY + step);
			}
			ctx.restore();
		}

		ctx.fillStyle = isHighlighted ? highlightColor : defaultColor;
		ctx.fillText(displayWord, cursorX, lineY);

		ctx.restore();

		cursorX += wordWidth;
		if (w < wordsInLine.length - 1) {
			cursorX += spaceWidth;
		}
	}

	drawTextDecoration({
		ctx,
		textDecoration,
		lineWidth,
		lineY,
		metrics,
		scaledFontSize,
		textAlign,
	});
}

export function renderTextToContext({
	node,
	ctx,
}: {
	node: TextNode;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}): void {
	const resolved = node.resolved;
	if (!resolved) {
		return;
	}

	const x = resolved.transform.position.x + node.params.canvasCenter.x;
	const y = resolved.transform.position.y + node.params.canvasCenter.y;
	const baseline = node.params.textBaseline ?? "middle";
	const {
		scaledFontSize,
		fontString,
		letterSpacing,
		lineHeightPx,
		lines,
		lineMetrics,
		block,
		fontSizeRatio,
		resolvedBackground,
	} = resolved.measuredText;
	const lineCount = lines.length;
	const resolvedBackgroundWithColor = {
		...resolvedBackground,
		color: resolved.backgroundColor,
	};

	const strokeWidth = resolved.strokeWidth;
	const strokeColor = resolved.strokeColor;
	const strokeRadius =
		strokeWidth > 0 ? Math.max(1, strokeWidth * fontSizeRatio * 2) : 0;

	const hasKaraoke =
		resolved.captionStyle &&
		resolved.captionStyle.highlightMode === "word" &&
		resolved.captionStyle.wordTimings.length > 0;

	ctx.save();
	ctx.translate(x, y);
	ctx.scale(resolved.transform.scaleX, resolved.transform.scaleY);
	if (resolved.transform.rotate) {
		ctx.rotate((resolved.transform.rotate * Math.PI) / 180);
	}

	ctx.font = fontString;
	ctx.textAlign = node.params.textAlign;
	ctx.textBaseline = baseline;
	ctx.fillStyle = resolved.textColor;
	setCanvasLetterSpacing({ ctx, letterSpacingPx: letterSpacing });

	if (
		node.params.background.enabled &&
		node.params.background.color &&
		node.params.background.color !== "transparent" &&
		lineCount > 0
	) {
		const backgroundRect = getTextBackgroundRect({
			textAlign: node.params.textAlign,
			block,
			background: resolvedBackgroundWithColor,
			fontSizeRatio,
		});
		if (backgroundRect) {
			const p =
				clamp({
					value: resolvedBackgroundWithColor.cornerRadius,
					min: CORNER_RADIUS_MIN,
					max: CORNER_RADIUS_MAX,
				}) / 100;
			const radius =
				(Math.min(backgroundRect.width, backgroundRect.height) / 2) * p;
			ctx.fillStyle = resolvedBackgroundWithColor.color;
			ctx.beginPath();
			ctx.roundRect(
				backgroundRect.left,
				backgroundRect.top,
				backgroundRect.width,
				backgroundRect.height,
				radius,
			);
			ctx.fill();
			ctx.fillStyle = resolved.textColor;
		}
	}

	if (hasKaraoke && resolved.captionStyle) {
		const captionStyle = resolved.captionStyle;
		const activeWordIdx = findActiveWordIndex({
			wordTimings: captionStyle.wordTimings,
			localTimeSeconds: resolved.localTimeSeconds,
		});

		if (
			captionStyle.wordAnimation === "popup" &&
			captionStyle.wordTimings.length === 1 &&
			captionStyle.category === "animated-sentence"
		) {
			const popupWordIdx = findLastActiveWordIndex({
				wordTimings: captionStyle.wordTimings,
				localTimeSeconds: resolved.localTimeSeconds,
			});
			renderPopupWord({
				ctx,
				captionStyle,
				activeWordIdx: popupWordIdx,
				scaledFontSize,
				strokeRadius,
				strokeColor,
				defaultColor: resolved.textColor,
				highlightColor: captionStyle.highlightColor,
				wordColorPalette: captionStyle.wordColorPalette,
				highlightColorPalette: captionStyle.highlightColorPalette,
				fontString,
				letterSpacing,
				lines,
				lineMetrics,
				block,
				localTimeSeconds: resolved.localTimeSeconds,
			});
		} else {
			const revealFutureWords = captionStyle.category === "animated-sentence";
			let globalWordOffset = 0;
			for (let index = 0; index < lineCount; index++) {
				const lineY = index * lineHeightPx - block.visualCenterOffset;
				const wordsInLine = lines[index]
					.split(/\s+/)
					.filter((w) => w.length > 0);

				renderKaraokeLine({
					ctx,
					line: lines[index],
					lineY,
					lineWidth: lineMetrics[index].width,
					scaledFontSize,
					textAlign: node.params.textAlign,
					strokeRadius,
					strokeColor,
					defaultColor: resolved.textColor,
					highlightColor: captionStyle.highlightColor,
					activeWordIndex: activeWordIdx,
					textDecoration: node.params.textDecoration ?? "none",
					metrics: lineMetrics[index],
					wordsInLine,
					globalWordOffset,
					wordTimings: captionStyle.wordTimings,
					localTimeSeconds: resolved.localTimeSeconds,
					wordAnimation: captionStyle.wordAnimation ?? "none",
					wordAnimationDuration: captionStyle.wordAnimationDuration ?? 0.14,
					revealFutureWords,
				});

				globalWordOffset += wordsInLine.length;
			}
		}
	} else {
		for (let index = 0; index < lineCount; index++) {
			const lineY = index * lineHeightPx - block.visualCenterOffset;
			if (strokeRadius > 0) {
				drawOutsideTextStroke({
					ctx,
					text: lines[index],
					y: lineY,
					radius: strokeRadius,
					color: strokeColor,
				});
			}
			ctx.fillText(lines[index], 0, lineY);
			drawTextDecoration({
				ctx,
				textDecoration: node.params.textDecoration ?? "none",
				lineWidth: lineMetrics[index].width,
				lineY,
				metrics: lineMetrics[index],
				scaledFontSize,
				textAlign: node.params.textAlign,
			});
		}
	}

	ctx.restore();
}
