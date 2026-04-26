import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "bubbles";
const BASE_URL = "/stickers/bubbles";

interface BubbleRecord {
	id: string;
	name: string;
	tags: string[];
}

const BUBBLES: BubbleRecord[] = [
	{
		id: "speech-bubble",
		name: "Speech Bubble",
		tags: ["talk", "chat", "dialog"],
	},
	{ id: "thought-bubble", name: "Thought Bubble", tags: ["think", "idea"] },
	{
		id: "shout-bubble",
		name: "Shout Bubble",
		tags: ["loud", "explosion", "yell"],
	},
	{ id: "whisper-bubble", name: "Whisper Bubble", tags: ["quiet", "small"] },
	{ id: "rounded-rect", name: "Rounded Box", tags: ["callout", "box"] },
	{ id: "circle-callout", name: "Circle Callout", tags: ["circle", "point"] },
	{ id: "cloud-bubble", name: "Cloud Bubble", tags: ["cloud", "talk"] },
	{ id: "banner", name: "Banner", tags: ["ribbon", "text", "header"] },
	{ id: "label-tag", name: "Label Tag", tags: ["tag", "price", "label"] },
	{ id: "quote-start", name: "Open Quote", tags: ["quote", "begin"] },
	{ id: "quote-end", name: "Close Quote", tags: ["quote", "end"] },
	{ id: "text-box", name: "Text Box", tags: ["text", "box", "caption"] },
	{ id: "star-burst", name: "Star Burst", tags: ["explosion", "pop", "bang"] },
	{
		id: "highlight",
		name: "Highlight",
		tags: ["marker", "yellow", "emphasize"],
	},
	{ id: "arrow-callout", name: "Arrow Callout", tags: ["pointer", "callout"] },
	{
		id: "double-bubble",
		name: "Double Bubble",
		tags: ["chat", "dialog", "two"],
	},
	{ id: "scroll", name: "Scroll", tags: ["parchment", "paper"] },
	{ id: "note", name: "Sticky Note", tags: ["note", "paper", "yellow"] },
	{
		id: "caption-bar",
		name: "Caption Bar",
		tags: ["subtitle", "bottom", "caption"],
	},
	{
		id: "frame-ornate",
		name: "Ornate Frame",
		tags: ["frame", "border", "decorative"],
	},
];

function toStickerItem(bubble: BubbleRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: bubble.id }),
		provider: PROVIDER_ID,
		name: bubble.name,
		previewUrl: `${BASE_URL}/${bubble.id}.svg`,
		metadata: { tags: bubble.tags },
	};
}

export const bubblesProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = BUBBLES.filter(
			(b) =>
				b.name.toLowerCase().includes(q) ||
				b.id.includes(q) ||
				b.tags.some((t) => t.includes(q)),
		);
		return {
			items: matched.map(toStickerItem),
			total: matched.length,
			hasMore: false,
		};
	},
	async browse(): Promise<StickerBrowseResult> {
		return {
			sections: [
				{
					id: "all",
					items: BUBBLES.map(toStickerItem),
					hasMore: false,
					layout: "grid",
				},
			],
		};
	},
	resolveUrl({
		stickerId,
	}: {
		stickerId: string;
		options?: { width?: number; height?: number };
	}): string {
		const { providerValue } = parseStickerId({ stickerId });
		return `${BASE_URL}/${providerValue}.svg`;
	},
};
