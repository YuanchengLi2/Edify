import { describe, expect, test } from "bun:test";
import {
	canElementGoOnTrack,
	getTrackTypeForElementType,
} from "@/lib/timeline/placement/compatibility";

describe("timeline placement compatibility", () => {
	test("routes mask elements to mask tracks", () => {
		expect(getTrackTypeForElementType({ elementType: "mask" })).toBe("mask");
		expect(canElementGoOnTrack({ elementType: "mask", trackType: "mask" })).toBe(
			true,
		);
		expect(canElementGoOnTrack({ elementType: "mask", trackType: "text" })).toBe(
			false,
		);
	});
});
