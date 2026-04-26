import { describe, expect, test } from "bun:test";
import type { Mask } from "@/lib/masks/types";
import {
	filterMaskDefinitions,
	getRenderableMask,
	toggleMaskVisibilityInElement,
} from "@/lib/masks/browser-and-visibility";
import type { MaskableElement } from "@/lib/timeline";

describe("mask browser filtering", () => {
	test("returns all definitions when the query is empty", () => {
		const defs = [
			{ type: "rectangle", name: "Rectangle" },
			{ type: "ellipse", name: "Ellipse" },
		] as any;

		expect(filterMaskDefinitions({ definitions: defs, query: "" })).toEqual(
			defs,
		);
	});

	test("filters definitions by name and type", () => {
		const defs = [
			{ type: "rounded-rect", name: "Rounded Rectangle" },
			{ type: "cinematic-bars", name: "Cinematic Bars" },
			{ type: "ellipse", name: "Ellipse" },
		] as any;

		expect(
			filterMaskDefinitions({ definitions: defs, query: "round" }).map(
				(definition) => definition.type,
			),
		).toEqual(["rounded-rect"]);

		expect(
			filterMaskDefinitions({ definitions: defs, query: "bars" }).map(
				(definition) => definition.type,
			),
		).toEqual(["cinematic-bars"]);
	});
});

describe("mask visibility helpers", () => {
	test("returns the first visible mask for rendering", () => {
		const masks = [
			buildMask("mask-1", { visible: false }),
			buildMask("mask-2", { visible: true }),
			buildMask("mask-3", { visible: true }),
		];

		expect(getRenderableMask({ masks })?.id).toBe("mask-2");
	});

	test("treats missing visibility as visible for older data", () => {
		const masks = [buildMask("mask-1", { visible: undefined })];

		expect(getRenderableMask({ masks })?.id).toBe("mask-1");
	});

	test("toggles persisted visibility on the requested mask", () => {
		const element = buildElement({
			masks: [buildMask("mask-1", { visible: true }), buildMask("mask-2")],
		});

		const updated = toggleMaskVisibilityInElement({
			element,
			maskId: "mask-1",
		});

		expect(updated.masks?.[0]?.visible).toBe(false);
		expect(updated.masks?.[1]?.visible).toBe(true);
	});
});

function buildMask(
	id: string,
	{ visible = true }: { visible?: boolean | undefined } = {},
): Mask {
	return {
		id,
		visible,
		type: "rectangle",
		params: {
			feather: 0,
			inverted: false,
			strokeColor: "#ffffff",
			strokeWidth: 0,
			strokeAlign: "center",
			fillColor: "#000000",
			fillOpacity: 0,
			centerX: 0,
			centerY: 0,
			width: 0.5,
			height: 0.5,
			rotation: 0,
			scale: 1,
		},
	};
}

function buildElement(
	overrides: Partial<MaskableElement> = {},
): MaskableElement {
	return {
		id: "element-1",
		type: "image",
		mediaId: "media-1",
		name: "Image",
		duration: 10,
		startTime: 0,
		trimStart: 0,
		trimEnd: 0,
		transform: {
			scaleX: 1,
			scaleY: 1,
			position: { x: 0, y: 0 },
			rotate: 0,
		},
		opacity: 1,
		...overrides,
	} as unknown as MaskableElement;
}
