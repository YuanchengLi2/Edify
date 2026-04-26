import { describe, expect, test } from "bun:test";
import type { Mask } from "@/lib/masks/types";
import type { MaskableElement } from "@/lib/timeline";
import { getMaskDisplayName, renameMaskInElement } from "@/lib/masks/naming";

describe("mask naming", () => {
	test("uses custom mask name when present", () => {
		const mask = buildMask({ id: "mask-1", name: "Face crop" });

		expect(
			getMaskDisplayName({
				mask,
				fallbackName: "Rectangle",
				index: 0,
			}),
		).toBe("Face crop");
	});

	test("falls back to numbered definition name when custom name is missing", () => {
		const mask = buildMask({ id: "mask-1" });

		expect(
			getMaskDisplayName({
				mask,
				fallbackName: "Rectangle",
				index: 1,
			}),
		).toBe("Rectangle 2");
	});

	test("trims renamed mask names before storing them", () => {
		const element = buildElement({
			masks: [buildMask({ id: "mask-1" }), buildMask({ id: "mask-2" })],
		});

		const updated = renameMaskInElement({
			element,
			maskId: "mask-2",
			name: "  Speaker  ",
		});

		expect(updated.masks?.[1]?.name).toBe("Speaker");
		expect(updated.masks?.[0]?.name).toBeUndefined();
	});

	test("clears custom name when renamed to an empty string", () => {
		const element = buildElement({
			masks: [buildMask({ id: "mask-1", name: "Old name" })],
		});

		const updated = renameMaskInElement({
			element,
			maskId: "mask-1",
			name: "   ",
		});

		expect(updated.masks?.[0]?.name).toBeUndefined();
	});
});

function buildMask({ id, name }: { id: string; name?: string }): Mask {
	return {
		id,
		name,
		visible: true,
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
		...({
			type: "graphic",
			mediaId: "graphic-1",
			transform: {
				position: { x: 0, y: 0 },
				scale: { x: 1, y: 1 },
				rotation: 0,
			},
			opacity: 100,
		} as any),
		...overrides,
	};
}
