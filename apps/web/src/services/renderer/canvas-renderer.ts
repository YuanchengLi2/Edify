import type { FrameRate } from "opencut-wasm";
import type { AnyBaseNode } from "./nodes/base-node";
import { buildFrameDescriptor } from "./compositor/frame-descriptor";
import { wasmCompositor } from "./compositor/wasm-compositor";
import { resolveRenderTree } from "./resolve";
import { EffectLayerNode } from "./nodes/effect-layer-node";
import {
	applyCanvasFilterEffects,
	isCanvasFilterEffectType,
} from "@/lib/effects/canvas-filters";
import type { Effect } from "@/lib/effects/types";

export type CanvasRendererParams = {
	width: number;
	height: number;
	fps: FrameRate;
};

function collectCanvasFilterEffects(node: AnyBaseNode, time: number): Effect[] {
	const effects: Effect[] = [];

	for (const child of node.children) {
		if (child instanceof EffectLayerNode) {
			const t = time;
			if (
				t < child.params.timeOffset - 1e-6 ||
				t >= child.params.timeOffset + child.params.duration + 1e-6
			) {
				continue;
			}
			if (isCanvasFilterEffectType(child.params.effectType)) {
				effects.push({
					id: child.params.effectType,
					type: child.params.effectType,
					params: child.params.effectParams,
					enabled: true,
				});
			}
		}
		effects.push(...collectCanvasFilterEffects(child, time));
	}

	return effects;
}

export class CanvasRenderer {
	canvas: OffscreenCanvas | HTMLCanvasElement;
	context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
	width: number;
	height: number;
	fps: FrameRate;

	constructor({ width, height, fps }: CanvasRendererParams) {
		this.width = width;
		this.height = height;
		this.fps = fps;

		try {
			this.canvas = new OffscreenCanvas(width, height);
		} catch {
			this.canvas = document.createElement("canvas");
			this.canvas.width = width;
			this.canvas.height = height;
		}

		const context = this.canvas.getContext("2d");
		if (!context) {
			throw new Error("Failed to get canvas context");
		}

		this.context = context as
			| OffscreenCanvasRenderingContext2D
			| CanvasRenderingContext2D;
	}

	private lastHadCanvasEffects = false;

	getOutputCanvas(): HTMLCanvasElement {
		wasmCompositor.ensureInitialized({
			width: this.width,
			height: this.height,
		});
		if (this.lastHadCanvasEffects) {
			return this.canvas as HTMLCanvasElement;
		}
		return wasmCompositor.getCanvas();
	}

	setSize({ width, height }: { width: number; height: number }) {
		this.width = width;
		this.height = height;

		if (this.canvas instanceof OffscreenCanvas) {
			this.canvas = new OffscreenCanvas(width, height);
		} else {
			this.canvas.width = width;
			this.canvas.height = height;
		}

		const context = this.canvas.getContext("2d");
		if (!context) {
			throw new Error("Failed to get canvas context");
		}
		this.context = context as
			| OffscreenCanvasRenderingContext2D
			| CanvasRenderingContext2D;
	}

	async render({ node, time }: { node: AnyBaseNode; time: number }) {
		await resolveRenderTree({ node, renderer: this, time });
		const { frame, textures } = await buildFrameDescriptor({
			node,
			renderer: this,
		});
		wasmCompositor.ensureInitialized({
			width: this.width,
			height: this.height,
		});
		wasmCompositor.syncTextures(textures);
		wasmCompositor.render(frame);

		const canvasFilterEffects = collectCanvasFilterEffects(node, time);
		this.lastHadCanvasEffects = canvasFilterEffects.length > 0;
		if (canvasFilterEffects.length > 0) {
			const compositorCanvas = wasmCompositor.getCanvas();
			const filtered = applyCanvasFilterEffects({
				source: compositorCanvas,
				width: this.width,
				height: this.height,
				effects: canvasFilterEffects,
			});
			this.context.clearRect(0, 0, this.width, this.height);
			this.context.drawImage(filtered, 0, 0, this.width, this.height);
		}
	}

	async renderToCanvas({
		node,
		time,
		targetCanvas,
	}: {
		node: AnyBaseNode;
		time: number;
		targetCanvas: HTMLCanvasElement;
	}) {
		await this.render({ node, time });

		const ctx = targetCanvas.getContext("2d");
		if (!ctx) {
			throw new Error("Failed to get target canvas context");
		}

		if (this.lastHadCanvasEffects) {
			ctx.drawImage(this.canvas, 0, 0, targetCanvas.width, targetCanvas.height);
		} else {
			ctx.drawImage(
				wasmCompositor.getCanvas(),
				0,
				0,
				targetCanvas.width,
				targetCanvas.height,
			);
		}
	}
}
