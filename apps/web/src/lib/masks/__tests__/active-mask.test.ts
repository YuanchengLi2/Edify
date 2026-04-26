import { describe, expect, test } from "bun:test";
import type { Mask } from "@/lib/masks/types";
import {
	appendMask,
	duplicateMask,
	getNextActiveMaskId,
	reorderMasks,
	resolveActiveMaskId,
} from "@/lib/masks/active-mask";

describe("active mask selection", () => {
	test("keeps the requested active mask when it still exists", () => {
		const masks = [buildMask("mask-1"), buildMask("mask-2")];

		expect(resolveActiveMaskId({ masks, activeMaskId: "mask-2" })).toBe(
			"mask-2",
		);
	});

	test("falls back to the first mask when the requested one is missing", () => {
		const masks = [buildMask("mask-1"), buildMask("mask-2")];

		expect(resolveActiveMaskId({ masks, activeMaskId: "missing" })).toBe(
			"mask-1",
		);
	});

	test("returns null when there are no masks", () => {
		expect(resolveActiveMaskId({ masks: [], activeMaskId: "mask-1" })).toBe(
			null,
		);
	});

	test("moves active selection to the next surviving mask after removal", () => {
		const masks = [
			buildMask("mask-1"),
			buildMask("mask-2"),
			buildMask("mask-3"),
		];

		expect(
			getNextActiveMaskId({
				masks,
				activeMaskId: "mask-2",
				removedMaskId: "mask-2",
			}),
		).toBe("mask-3");
	});

	test("falls back to the previous mask when the removed one was last", () => {
		const masks = [buildMask("mask-1"), buildMask("mask-2")];

		expect(
			getNextActiveMaskId({
				masks,
				activeMaskId: "mask-2",
				removedMaskId: "mask-2",
			}),
		).toBe("mask-1");
	});

	test("keeps the current active mask when a different mask is removed", () => {
		const masks = [
			buildMask("mask-1"),
			buildMask("mask-2"),
			buildMask("mask-3"),
		];

		expect(
			getNextActiveMaskId({
				masks,
				activeMaskId: "mask-1",
				removedMaskId: "mask-3",
			}),
		).toBe("mask-1");
	});

	test("appends a new mask and makes it active", () => {
		const masks = [buildMask("mask-1")];
		const newMask = buildMask("mask-2");

		expect(appendMask({ masks, mask: newMask })).toEqual({
			masks: [masks[0], newMask],
			activeMaskId: "mask-2",
		});
	});

	test("duplicates a mask after its source and selects the duplicate", () => {
		const masks = [buildMask("mask-1"), buildMask("mask-2")];

		const result = duplicateMask({
			masks,
			maskId: "mask-1",
			duplicateId: "mask-1-copy",
		});

		expect(result?.activeMaskId).toBe("mask-1-copy");
		expect(result?.masks.map((mask) => mask.id)).toEqual([
			"mask-1",
			"mask-1-copy",
			"mask-2",
		]);
	});

	test("reorders masks and preserves the active mask id", () => {
		const masks = [buildMask("mask-1"), buildMask("mask-2"), buildMask("mask-3")];

		expect(
			reorderMasks({
				masks,
				fromIndex: 2,
				toIndex: 0,
				activeMaskId: "mask-3",
			}),
		).toEqual({
			masks: [masks[2], masks[0], masks[1]],
			activeMaskId: "mask-3",
		});
	});

	test("returns null when reorder indexes are invalid", () => {
		const masks = [buildMask("mask-1"), buildMask("mask-2")];

		expect(
			reorderMasks({
				masks,
				fromIndex: -1,
				toIndex: 1,
				activeMaskId: "mask-1",
			}),
		).toBeNull();

		expect(
			reorderMasks({
				masks,
				fromIndex: 0,
				toIndex: 3,
				activeMaskId: "mask-1",
			}),
		).toBeNull();
	});
});

function buildMask(id: string): Mask {
	return {
		id,
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
