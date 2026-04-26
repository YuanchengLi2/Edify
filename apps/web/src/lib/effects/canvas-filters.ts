import type { Effect } from "@/lib/effects/types";
import { createOffscreenCanvas } from "@/services/renderer/canvas-utils";

type FilterPresetConfig = {
	brightness: number;
	contrast: number;
	saturate: number;
	sepia: number;
	hueRotate: number;
	blur: number;
	glow: number;
};

const PRESET_CONFIGS: Record<string, FilterPresetConfig> = {
	blur: {
		brightness: 0,
		contrast: -0.16,
		saturate: 0,
		sepia: 0,
		hueRotate: 0,
		blur: 1.35,
		glow: 0,
	},
	glow: {
		brightness: 0.18,
		contrast: 0.12,
		saturate: 0.18,
		sepia: 0.02,
		hueRotate: 0,
		blur: 0.04,
		glow: 1.85,
	},
	vignette: {
		brightness: -0.14,
		contrast: 0.28,
		saturate: -0.04,
		sepia: 0.03,
		hueRotate: 0,
		blur: 0,
		glow: 0,
	},
	sharpen: {
		brightness: 0.04,
		contrast: 0.42,
		saturate: 0.1,
		sepia: 0,
		hueRotate: 0,
		blur: 0,
		glow: 0,
	},
	"film-grain": {
		brightness: -0.08,
		contrast: 0.26,
		saturate: -0.02,
		sepia: 0.16,
		hueRotate: 0,
		blur: 0,
		glow: 0,
	},
	"chromatic-aberration": {
		brightness: 0.1,
		contrast: 0.22,
		saturate: 0.42,
		sepia: 0,
		hueRotate: 22,
		blur: 0,
		glow: 0,
	},
	glitch: {
		brightness: 0.14,
		contrast: 0.38,
		saturate: 0.58,
		sepia: 0,
		hueRotate: -34,
		blur: 0,
		glow: 0,
	},
	"zoom-punch": {
		brightness: 0.16,
		contrast: 0.42,
		saturate: 0.3,
		sepia: 0,
		hueRotate: 0,
		blur: 0,
		glow: 0.32,
	},
	clarity: {
		brightness: 0,
		contrast: 0.34,
		saturate: 0.12,
		sepia: 0,
		hueRotate: 0,
		blur: 0,
		glow: 0,
	},
	flash: {
		brightness: 0.7,
		contrast: 0.48,
		saturate: 0.85,
		sepia: 0.12,
		hueRotate: 16,
		blur: 0,
		glow: 1.4,
	},
	"soft-glow": {
		brightness: 0.34,
		contrast: -0.12,
		saturate: 0.3,
		sepia: 0.04,
		hueRotate: 0,
		blur: 0.16,
		glow: 1.5,
	},
	dreamy: {
		brightness: 0.24,
		contrast: -0.2,
		saturate: 0.24,
		sepia: 0.2,
		hueRotate: 24,
		blur: 0.22,
		glow: 1.55,
	},
	halo: {
		brightness: 0.44,
		contrast: 0.16,
		saturate: 0.34,
		sepia: 0.05,
		hueRotate: 12,
		blur: 0.08,
		glow: 1.8,
	},
	haze: {
		brightness: 0.14,
		contrast: -0.28,
		saturate: -0.12,
		sepia: 0.1,
		hueRotate: -12,
		blur: 0.82,
		glow: 0.7,
	},
	frost: {
		brightness: 0.14,
		contrast: 0.14,
		saturate: -0.18,
		sepia: 0,
		hueRotate: -42,
		blur: 0.04,
		glow: 0.62,
	},
	"noir-soft": {
		brightness: -0.14,
		contrast: 0.48,
		saturate: -1,
		sepia: 0.02,
		hueRotate: 0,
		blur: 0.03,
		glow: 0.32,
	},
	pulse: {
		brightness: 0.28,
		contrast: 0.38,
		saturate: 0.72,
		sepia: 0.02,
		hueRotate: 18,
		blur: 0,
		glow: 1.05,
	},
	drift: {
		brightness: 0.12,
		contrast: -0.1,
		saturate: 0.16,
		sepia: 0.16,
		hueRotate: 30,
		blur: 0.08,
		glow: 0.6,
	},
	"bloom-plus": {
		brightness: 0.48,
		contrast: 0.24,
		saturate: 0.4,
		sepia: 0.04,
		hueRotate: 8,
		blur: 0.12,
		glow: 2,
	},
	velvet: {
		brightness: 0.18,
		contrast: -0.14,
		saturate: 0.24,
		sepia: 0.22,
		hueRotate: 30,
		blur: 0.06,
		glow: 0.88,
	},
	"retro-pop": {
		brightness: 0.22,
		contrast: 0.32,
		saturate: 0.82,
		sepia: 0.34,
		hueRotate: 28,
		blur: 0,
		glow: 0.44,
	},
	"ice-pop": {
		brightness: 0.22,
		contrast: 0.22,
		saturate: 0.28,
		sepia: 0,
		hueRotate: -52,
		blur: 0,
		glow: 0.68,
	},
	sunset: {
		brightness: 0.32,
		contrast: 0.24,
		saturate: 0.6,
		sepia: 0.38,
		hueRotate: 42,
		blur: 0,
		glow: 0.8,
	},
	"mono-fade": {
		brightness: 0.1,
		contrast: -0.22,
		saturate: -1,
		sepia: 0,
		hueRotate: 0,
		blur: 0.02,
		glow: 0.34,
	},
	amber: {
		brightness: 0.12,
		contrast: 0.18,
		saturate: 0.3,
		sepia: 0.45,
		hueRotate: 18,
		blur: 0,
		glow: 0.5,
	},
	cyberpunk: {
		brightness: 0.22,
		contrast: 0.48,
		saturate: 0.85,
		sepia: 0,
		hueRotate: -28,
		blur: 0,
		glow: 0.72,
	},
	vhs: {
		brightness: 0.06,
		contrast: 0.32,
		saturate: 0.55,
		sepia: 0.18,
		hueRotate: 8,
		blur: 0.03,
		glow: 0.28,
	},
	polaroid: {
		brightness: 0.16,
		contrast: -0.12,
		saturate: -0.15,
		sepia: 0.28,
		hueRotate: 14,
		blur: 0.04,
		glow: 0.22,
	},
	cinematic: {
		brightness: -0.06,
		contrast: 0.38,
		saturate: -0.08,
		sepia: 0.06,
		hueRotate: 0,
		blur: 0,
		glow: 0.15,
	},
	"teal-orange": {
		brightness: 0.08,
		contrast: 0.3,
		saturate: 0.48,
		sepia: 0.08,
		hueRotate: -8,
		blur: 0,
		glow: 0.2,
	},
	desaturate: {
		brightness: 0.04,
		contrast: 0.12,
		saturate: -0.55,
		sepia: 0.04,
		hueRotate: 0,
		blur: 0,
		glow: 0,
	},
	neon: {
		brightness: 0.35,
		contrast: 0.42,
		saturate: 1.1,
		sepia: 0,
		hueRotate: -12,
		blur: 0,
		glow: 1.6,
	},
	matte: {
		brightness: 0.1,
		contrast: -0.18,
		saturate: -0.22,
		sepia: 0.12,
		hueRotate: 6,
		blur: 0.02,
		glow: 0.18,
	},
	lomo: {
		brightness: 0.08,
		contrast: 0.55,
		saturate: 0.9,
		sepia: 0.08,
		hueRotate: 0,
		blur: 0,
		glow: 0.42,
	},
	infrared: {
		brightness: 0.2,
		contrast: 0.35,
		saturate: 1.4,
		sepia: 0,
		hueRotate: 90,
		blur: 0,
		glow: 0.55,
	},
	"sepia-film": {
		brightness: 0.06,
		contrast: 0.2,
		saturate: -0.3,
		sepia: 0.72,
		hueRotate: 12,
		blur: 0.03,
		glow: 0.25,
	},
	pastel: {
		brightness: 0.28,
		contrast: -0.22,
		saturate: 0.08,
		sepia: 0.08,
		hueRotate: 22,
		blur: 0.06,
		glow: 0.85,
	},
	"contrast-pop": {
		brightness: 0.1,
		contrast: 0.58,
		saturate: 0.52,
		sepia: 0,
		hueRotate: 0,
		blur: 0,
		glow: 0,
	},
};

export function isCanvasFilterEffectType(effectType: string): boolean {
	return effectType in PRESET_CONFIGS;
}

function getNumber(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function getDefaultBlurControl(effectType: string): number {
	switch (effectType) {
		case "blur":
		case "blur-background":
			return 0.9;
		case "soft-glow":
		case "dreamy":
		case "haze":
		case "bloom-plus":
			return 0.12;
		case "halo":
			return 0.06;
		case "velvet":
		case "drift":
		case "frost":
			return 0.05;
		default:
			return 0;
	}
}

function getControlValues(effect: Effect) {
	if (
		"speed" in effect.params ||
		"color" in effect.params ||
		"strength" in effect.params ||
		"glow" in effect.params ||
		"blur" in effect.params
	) {
		return {
			speed: clamp01(getNumber(effect.params.speed, 33) / 100),
			color: clamp01(getNumber(effect.params.color, 65) / 100),
			strength: clamp01(getNumber(effect.params.strength, 50) / 100),
			glow: clamp01(getNumber(effect.params.glow, 50) / 100),
			blur: clamp01(
				getNumber(
					effect.params.blur,
					getDefaultBlurControl(effect.type) * 100,
				) / 100,
			),
		};
	}

	const intensity = clamp01(getNumber(effect.params.intensity, 50) / 100);
	const threshold = clamp01(getNumber(effect.params.threshold, 50) / 100);
	const defaultBlur = getDefaultBlurControl(effect.type);
	return {
		speed: clamp01(0.25 + intensity * 1.15),
		color: clamp01(0.45 + intensity * 0.95),
		strength: clamp01(0.3 + intensity * 1.2),
		glow:
			effect.type === "glow"
				? clamp01(0.6 + (1 - threshold * 0.6) * 0.7)
				: clamp01(0.2 + intensity * 1.1),
		blur: clamp01(defaultBlur * (0.35 + intensity * 0.9)),
	};
}

function overlayColor({
	ctx,
	width,
	height,
	color,
	alpha,
	mode = "screen",
}: {
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	width: number;
	height: number;
	color: string;
	alpha: number;
	mode?: GlobalCompositeOperation;
}) {
	ctx.save();
	ctx.globalCompositeOperation = mode;
	ctx.globalAlpha = alpha;
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, width, height);
	ctx.restore();
}

function applyRgbSplit({
	ctx,
	source,
	width,
	height,
	amount,
}: {
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	source: CanvasImageSource;
	width: number;
	height: number;
	amount: number;
}) {
	if (amount <= 0) return;
	ctx.save();
	ctx.globalCompositeOperation = "screen";
	ctx.globalAlpha = Math.min(0.3, amount * 0.22);
	ctx.filter = "hue-rotate(24deg) saturate(1.8)";
	ctx.drawImage(source, amount, 0, width, height);
	ctx.filter = "hue-rotate(-36deg) saturate(1.8)";
	ctx.drawImage(source, -amount, 0, width, height);
	ctx.restore();
}

function applyGlitchSlices({
	ctx,
	source,
	width,
	height,
	amount,
}: {
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	source: CanvasImageSource;
	width: number;
	height: number;
	amount: number;
}) {
	if (amount <= 0) return;
	ctx.save();
	ctx.globalCompositeOperation = "screen";
	ctx.globalAlpha = 0.32;
	for (let index = 0; index < 18; index++) {
		const sliceHeight = Math.max(
			4,
			Math.round((height / 12) * (0.4 + Math.random())),
		);
		const sy = Math.max(
			0,
			Math.min(
				height - sliceHeight,
				Math.round((height - sliceHeight) * Math.random()),
			),
		);
		const dx = (Math.random() - 0.5) * amount * 12;
		ctx.drawImage(
			source,
			0,
			sy,
			width,
			sliceHeight,
			dx,
			sy,
			width,
			sliceHeight,
		);
	}
	ctx.restore();
}

function applyCenterGlow({
	ctx,
	width,
	height,
	color,
	alpha,
}: {
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	width: number;
	height: number;
	color: string;
	alpha: number;
}) {
	if (alpha <= 0) return;
	const gradient = ctx.createRadialGradient(
		width / 2,
		height / 2,
		Math.min(width, height) * 0.08,
		width / 2,
		height / 2,
		Math.max(width, height) * 0.55,
	);
	gradient.addColorStop(
		0,
		`${color}${Math.round(alpha * 255)
			.toString(16)
			.padStart(2, "0")}`,
	);
	gradient.addColorStop(1, "transparent");
	ctx.save();
	ctx.globalCompositeOperation = "screen";
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);
	ctx.restore();
}

export function applyCanvasFilterEffects({
	source,
	width,
	height,
	effects,
	previewBoost = 1,
}: {
	source: CanvasImageSource;
	width: number;
	height: number;
	effects: Effect[] | undefined;
	previewBoost?: number;
}): CanvasImageSource {
	const filterEffects = (effects ?? []).filter(
		(effect) => effect.enabled && isCanvasFilterEffectType(effect.type),
	);
	if (filterEffects.length === 0) return source;

	let current: CanvasImageSource = source;
	for (const effect of filterEffects) {
		current = applySingleCanvasFilterEffect({
			source: current,
			width,
			height,
			effect,
			previewBoost,
		});
	}
	return current;
}

function applySingleCanvasFilterEffect({
	source,
	width,
	height,
	effect,
	previewBoost,
}: {
	source: CanvasImageSource;
	width: number;
	height: number;
	effect: Effect;
	previewBoost: number;
}): OffscreenCanvas | HTMLCanvasElement {
	const preset = PRESET_CONFIGS[effect.type];
	if (!preset) {
		const passthrough = createOffscreenCanvas({ width, height });
		const ctx = passthrough.getContext("2d") as OffscreenCanvasRenderingContext2D | null;
		ctx?.drawImage(source, 0, 0, width, height);
		return passthrough;
	}

	const { speed, color, strength, glow, blur } = getControlValues(effect);
	const boostedSpeed = clamp01(speed * previewBoost);
	const boostedColor = clamp01(color * previewBoost);
	const boostedStrength = clamp01(strength * previewBoost);
	const boostedGlow = clamp01(glow * previewBoost);
	const boostedBlur = clamp01(blur * previewBoost);

	const canvas = createOffscreenCanvas({ width, height });
	const ctx = canvas.getContext("2d") as
		| CanvasRenderingContext2D
		| OffscreenCanvasRenderingContext2D
		| null;
	if (!ctx) return canvas;

	const brightness =
		1 + preset.brightness * (0.45 * boostedSpeed + 1.25 * boostedStrength);
	const contrast =
		1 + preset.contrast * (0.35 * boostedSpeed + 1.35 * boostedStrength);
	const saturate = Math.max(0, 1 + preset.saturate * 1.35 * boostedColor);
	const sepia = clamp01(preset.sepia * 1.4 * boostedColor);
	const hueRotate = preset.hueRotate * (boostedColor - 0.5) * 2.6;
	const blurPx = preset.blur * boostedBlur * Math.min(width, height) * 0.028;

	let filterParts: string[];
	switch (effect.type) {
		case "blur":
		case "blur-background":
			filterParts = [
				`blur(${Math.max(2, blurPx * 1.8)}px)`,
				`brightness(${1 - boostedStrength * 0.04})`,
			];
			break;
		case "glow":
		case "soft-glow":
		case "halo":
		case "bloom-plus":
			filterParts = [
				`brightness(${brightness + 0.08})`,
				`contrast(${Math.max(0.7, contrast - 0.08)})`,
				`saturate(${saturate})`,
				...(blurPx > 0.01 ? [`blur(${Math.max(1, blurPx)}px)`] : []),
			];
			break;
		case "dreamy":
		case "haze":
		case "velvet":
		case "drift":
			filterParts = [
				`brightness(${brightness + 0.05})`,
				`contrast(${Math.max(0.65, contrast - 0.18)})`,
				`saturate(${saturate})`,
				`sepia(${sepia})`,
				...(blurPx > 0.01 ? [`blur(${Math.max(0.8, blurPx)}px)`] : []),
			];
			break;
		case "vignette":
		case "sharpen":
		case "clarity":
		case "film-grain":
		case "flash":
		case "pulse":
		case "retro-pop":
		case "sunset":
		case "ice-pop":
			filterParts = [
				`brightness(${brightness})`,
				`contrast(${contrast})`,
				`saturate(${saturate})`,
				`sepia(${sepia})`,
				`hue-rotate(${hueRotate}deg)`,
			];
			break;
		case "noir-soft":
		case "mono-fade":
			filterParts = [
				`grayscale(1)`,
				`brightness(${brightness})`,
				`contrast(${contrast})`,
				...(blurPx > 0.01 ? [`blur(${Math.max(0.4, blurPx * 0.4)}px)`] : []),
			];
			break;
		case "chromatic-aberration":
		case "glitch":
		case "zoom-punch":
			filterParts = [
				`brightness(${brightness})`,
				`contrast(${contrast + 0.08})`,
				`saturate(${saturate + 0.2})`,
			];
			break;
		case "frost":
			filterParts = [
				`brightness(${brightness + 0.04})`,
				`contrast(${contrast})`,
				`saturate(${Math.max(0, saturate - 0.2)})`,
				`hue-rotate(${hueRotate}deg)`,
			];
			break;
		default:
			filterParts = [
				`brightness(${brightness})`,
				`contrast(${contrast})`,
				`saturate(${saturate})`,
				`sepia(${sepia})`,
				`hue-rotate(${hueRotate}deg)`,
				...(blurPx > 0.01 ? [`blur(${blurPx}px)`] : []),
			];
	}

	ctx.filter = filterParts.join(" ");
	ctx.drawImage(source, 0, 0, width, height);
	ctx.filter = "none";

	if (effect.type === "vignette") {
		const gradient = ctx.createRadialGradient(
			width / 2,
			height / 2,
			Math.min(width, height) * 0.15,
			width / 2,
			height / 2,
			Math.max(width, height) * 0.65,
		);
		gradient.addColorStop(0, "rgba(0,0,0,0)");
		gradient.addColorStop(1, `rgba(0,0,0,${0.85 * boostedStrength})`);
		ctx.save();
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);
		ctx.restore();
	}

	if (effect.type === "flash") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#fff0c2",
			alpha: 0.22 + boostedStrength * 0.3,
			mode: "screen",
		});
	}

	if (effect.type === "soft-glow") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ffe2f3",
			alpha: 0.18 + boostedGlow * 0.2,
			mode: "screen",
		});
	}

	if (effect.type === "dreamy") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ffd9fb",
			alpha: 0.2 + boostedStrength * 0.22,
			mode: "screen",
		});
	}

	if (effect.type === "halo") {
		applyCenterGlow({
			ctx,
			width,
			height,
			color: "#fff4c7",
			alpha: 0.18 + boostedGlow * 0.16,
		});
	}

	if (effect.type === "haze") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ffffff",
			alpha: 0.08 + boostedStrength * 0.14,
			mode: "screen",
		});
	}

	if (effect.type === "frost" || effect.type === "ice-pop") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#8fd7ff",
			alpha: 0.1 + boostedColor * 0.16,
			mode: "screen",
		});
	}

	if (effect.type === "sunset") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ff9b54",
			alpha: 0.12 + boostedColor * 0.18,
			mode: "screen",
		});
	}

	if (effect.type === "retro-pop") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ffb56b",
			alpha: 0.08 + boostedColor * 0.12,
			mode: "overlay",
		});
	}

	if (effect.type === "velvet") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ffb4d8",
			alpha: 0.08 + boostedGlow * 0.1,
			mode: "soft-light",
		});
	}

	if (effect.type === "pulse") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ff66cc",
			alpha: 0.08 + boostedColor * 0.12,
			mode: "screen",
		});
	}

	if (effect.type === "mono-fade") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ffffff",
			alpha: 0.06 + boostedStrength * 0.12,
			mode: "screen",
		});
	}

	if (effect.type === "film-grain") {
		ctx.save();
		ctx.globalAlpha = 0.2 + boostedStrength * 0.35;
		const grainCount = Math.round(width * height * 0.012);
		for (let i = 0; i < grainCount; i++) {
			const x = Math.random() * width;
			const y = Math.random() * height;
			const bright = Math.random() > 0.5;
			const alpha = 0.3 + Math.random() * 0.7;
			ctx.fillStyle = bright
				? `rgba(255,255,255,${alpha})`
				: `rgba(0,0,0,${alpha * 0.6})`;
			ctx.fillRect(
				x,
				y,
				1 + Math.round(Math.random()),
				1 + Math.round(Math.random()),
			);
		}
		ctx.restore();
	}

	if (effect.type === "noir-soft") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#0b0b0b",
			alpha: 0.08 + boostedStrength * 0.12,
			mode: "multiply",
		});
	}

	if (effect.type === "mono-fade") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#f2f2f2",
			alpha: 0.08 + boostedStrength * 0.1,
			mode: "screen",
		});
	}

	if (effect.type === "sharpen") {
		ctx.save();
		ctx.globalCompositeOperation = "overlay";
		ctx.globalAlpha = 0.35 + boostedStrength * 0.45;
		ctx.filter = "contrast(1.6) saturate(1.1)";
		ctx.drawImage(canvas, 0, 0, width, height);
		ctx.restore();
		ctx.save();
		ctx.globalCompositeOperation = "hard-light";
		ctx.globalAlpha = 0.12 + boostedStrength * 0.15;
		ctx.filter = "contrast(2)";
		ctx.drawImage(canvas, 0, 0, width, height);
		ctx.restore();
	}

	if (effect.type === "clarity") {
		ctx.save();
		ctx.globalCompositeOperation = "overlay";
		ctx.globalAlpha = 0.28 + boostedStrength * 0.38;
		ctx.filter = "contrast(1.45) saturate(1.15)";
		ctx.drawImage(canvas, 0, 0, width, height);
		ctx.restore();
	}

	if (effect.type === "chromatic-aberration" || effect.type === "glitch") {
		applyRgbSplit({
			ctx,
			source: canvas,
			width,
			height,
			amount: 4 + boostedStrength * 14,
		});
	}

	if (effect.type === "glitch") {
		applyGlitchSlices({
			ctx,
			source: canvas,
			width,
			height,
			amount: 2 + boostedStrength * 10,
		});
	}

	if (effect.type === "zoom-punch") {
		const inset = Math.min(width, height) * 0.08 * boostedStrength;
		ctx.save();
		ctx.globalAlpha = 0.3 + boostedStrength * 0.4;
		ctx.drawImage(
			canvas,
			inset,
			inset,
			width - inset * 2,
			height - inset * 2,
			0,
			0,
			width,
			height,
		);
		ctx.restore();
	}

	if (effect.type === "drift") {
		ctx.save();
		ctx.globalAlpha = 0.12 + boostedStrength * 0.12;
		ctx.drawImage(canvas, 3 + boostedSpeed * 4, 0, width, height);
		ctx.restore();
	}

	if (effect.type === "amber") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#e8a838",
			alpha: 0.12 + boostedColor * 0.2,
			mode: "overlay",
		});
	}

	if (effect.type === "cyberpunk") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ff00ff",
			alpha: 0.1 + boostedColor * 0.16,
			mode: "screen",
		});
		applyRgbSplit({
			ctx,
			source: canvas,
			width,
			height,
			amount: 2 + boostedStrength * 5,
		});
	}

	if (effect.type === "vhs") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#3322ff",
			alpha: 0.06 + boostedColor * 0.08,
			mode: "screen",
		});
		applyRgbSplit({
			ctx,
			source: canvas,
			width,
			height,
			amount: 1 + boostedStrength * 4,
		});
	}

	if (effect.type === "polaroid") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#f5e6d0",
			alpha: 0.1 + boostedStrength * 0.14,
			mode: "screen",
		});
	}

	if (effect.type === "cinematic") {
		const cGradient = ctx.createRadialGradient(
			width / 2,
			height / 2,
			Math.min(width, height) * 0.25,
			width / 2,
			height / 2,
			Math.max(width, height) * 0.6,
		);
		cGradient.addColorStop(0, "rgba(0,0,0,0)");
		cGradient.addColorStop(1, `rgba(0,0,0,${0.4 * boostedStrength})`);
		ctx.save();
		ctx.fillStyle = cGradient;
		ctx.fillRect(0, 0, width, height);
		ctx.restore();
	}

	if (effect.type === "teal-orange") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#008080",
			alpha: 0.08 + boostedColor * 0.12,
			mode: "overlay",
		});
		overlayColor({
			ctx,
			width,
			height,
			color: "#ff8c00",
			alpha: 0.06 + boostedColor * 0.1,
			mode: "screen",
		});
	}

	if (effect.type === "neon") {
		applyCenterGlow({
			ctx,
			width,
			height,
			color: "#cc00ff",
			alpha: 0.22 + boostedGlow * 0.2,
		});
	}

	if (effect.type === "matte") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#d4c5a9",
			alpha: 0.08 + boostedStrength * 0.12,
			mode: "overlay",
		});
	}

	if (effect.type === "lomo") {
		const lGradient = ctx.createRadialGradient(
			width / 2,
			height / 2,
			Math.min(width, height) * 0.3,
			width / 2,
			height / 2,
			Math.max(width, height) * 0.7,
		);
		lGradient.addColorStop(0, "rgba(0,0,0,0)");
		lGradient.addColorStop(1, `rgba(0,0,0,${0.5 * boostedStrength})`);
		ctx.save();
		ctx.fillStyle = lGradient;
		ctx.fillRect(0, 0, width, height);
		ctx.restore();
	}

	if (effect.type === "infrared") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ff2244",
			alpha: 0.12 + boostedColor * 0.18,
			mode: "screen",
		});
	}

	if (effect.type === "sepia-film") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#8b6914",
			alpha: 0.1 + boostedColor * 0.15,
			mode: "overlay",
		});
	}

	if (effect.type === "pastel") {
		overlayColor({
			ctx,
			width,
			height,
			color: "#ffc8dd",
			alpha: 0.12 + boostedStrength * 0.14,
			mode: "screen",
		});
	}

	if (effect.type === "contrast-pop") {
		ctx.save();
		ctx.globalCompositeOperation = "overlay";
		ctx.globalAlpha = 0.3 + boostedStrength * 0.35;
		ctx.filter = "contrast(1.5)";
		ctx.drawImage(canvas, 0, 0, width, height);
		ctx.restore();
	}

	const glowAmount = preset.glow * 0.6 * boostedGlow;
	if (glowAmount > 0.01) {
		ctx.save();
		ctx.globalCompositeOperation = "screen";
		ctx.globalAlpha = Math.min(0.25, glowAmount * 0.2);
		ctx.filter = `blur(${Math.max(2, glowAmount * Math.min(width, height) * 0.018)}px) brightness(${1 + glowAmount * 0.2})`;
		ctx.drawImage(canvas, 0, 0, width, height);
		ctx.restore();
	}

	return canvas;
}
