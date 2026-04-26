import { describe, expect, test } from "bun:test";
import { rechunkCaptionElements } from "@/lib/captions/rebuild";
import type { TextElement } from "@/lib/timeline";

function createCaptionElement({
	content,
	startTime,
	duration,
	wordTimings,
}: {
	content: string;
	startTime: number;
	duration: number;
	wordTimings: Array<{ word: string; start: number; end: number }>;
}): TextElement {
	return {
		id: `${content}-${startTime}`,
		type: "text",
		name: content,
		content,
		startTime,
		duration,
		trimStart: 0,
		trimEnd: 0,
		fontSize: 8,
		fontFamily: "Inter",
		color: "#ffffff",
		strokeColor: "#000000",
		strokeWidth: 0,
		background: {
			enabled: false,
			color: "#000000",
			paddingX: 0,
			paddingY: 0,
			cornerRadius: 0,
		},
		textAlign: "center",
		fontWeight: "bold",
		fontStyle: "normal",
		textDecoration: "none",
		letterSpacing: 0,
		lineHeight: 1.2,
		transform: {
			position: { x: 0, y: 0 },
			scale: { x: 1, y: 1 },
			rotation: 0,
			anchor: { x: 0.5, y: 0.5 },
		},
		opacity: 1,
		blendMode: "normal",
		animations: [],
		effects: [],
		captionStyle: {
			presetId: "test",
			chunkMode: "short",
			category: "popup-short",
			wordTimings,
			highlightColor: "#ffff00",
			highlightMode: "word",
			wordAnimation: "none",
			wordAnimationDuration: 0,
		},
	};
}

describe("rechunkCaptionElements", () => {
	test("rebuilds sentence chunks from stored absolute word timings", () => {
		const elements = [
			createCaptionElement({
				content: "Wait, this",
				startTime: 0,
				duration: 400,
				wordTimings: [
					{ word: "Wait,", start: 0, end: 0.2 },
					{ word: "this", start: 0.21, end: 0.38 },
				],
			}),
			createCaptionElement({
				content: "works. Next",
				startTime: 400,
				duration: 500,
				wordTimings: [
					{ word: "works.", start: 0, end: 0.25 },
					{ word: "Next", start: 0.3, end: 0.45 },
				],
			}),
		];

		const chunks = rechunkCaptionElements({
			elements,
			chunkMode: "sentence",
			ticksPerSecond: 1000,
		});

		expect(chunks).toHaveLength(2);
		expect(chunks[0]?.text).toBe("Wait, this works.");
		expect(chunks[0]?.startTime).toBe(0);
		expect(chunks[1]?.text).toBe("Next");
		expect(chunks[1]?.startTime).toBe(0.7);
	});
});
