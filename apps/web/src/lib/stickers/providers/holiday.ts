import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "holiday";
const BASE_URL = "/stickers/holiday";

interface HolidayRecord {
	id: string;
	name: string;
	tags: string[];
}

const HOLIDAYS: HolidayRecord[] = [
	{
		id: "christmas-tree",
		name: "Christmas Tree",
		tags: ["xmas", "tree", "ornament"],
	},
	{
		id: "ornament",
		name: "Ornament",
		tags: ["decoration", "ball", "christmas"],
	},
	{ id: "snowman", name: "Snowman", tags: ["winter", "snow", "frosty"] },
	{
		id: "candy-cane",
		name: "Candy Cane",
		tags: ["christmas", "sweet", "cane"],
	},
	{ id: "present", name: "Present", tags: ["gift", "box", "bow"] },
	{ id: "santa-hat", name: "Santa Hat", tags: ["christmas", "santa", "red"] },
	{
		id: "reindeer",
		name: "Reindeer",
		tags: ["christmas", "rudolph", "antler"],
	},
	{ id: "stocking", name: "Stocking", tags: ["christmas", "hanging"] },
	{ id: "wreath", name: "Wreath", tags: ["christmas", "green", "door"] },
	{ id: "pumpkin", name: "Pumpkin", tags: ["halloween", "jack", "lantern"] },
	{ id: "ghost-happy", name: "Ghost", tags: ["halloween", "cute", "spooky"] },
	{ id: "bat", name: "Bat", tags: ["halloween", "dark", "wing"] },
	{ id: "skeleton", name: "Skeleton", tags: ["halloween", "skull", "bone"] },
	{
		id: "heart-valentine",
		name: "Love Heart",
		tags: ["valentine", "love", "arrow"],
	},
	{ id: "cupid", name: "Cupid", tags: ["valentine", "love", "bow"] },
	{ id: "rose", name: "Rose", tags: ["flower", "love", "red", "valentine"] },
	{ id: "easter-egg", name: "Easter Egg", tags: ["easter", "egg", "colorful"] },
	{ id: "bunny", name: "Easter Bunny", tags: ["easter", "rabbit", "cute"] },
	{
		id: "fireworks",
		name: "Fireworks",
		tags: ["celebration", "new year", "party"],
	},
	{
		id: "champagne",
		name: "Champagne",
		tags: ["celebration", "toast", "bottle"],
	},
	{ id: "balloon", name: "Balloons", tags: ["party", "birthday", "celebrate"] },
	{
		id: "birthday-cake",
		name: "Birthday Cake",
		tags: ["birthday", "cake", "candle"],
	},
	{ id: "party-hat", name: "Party Hat", tags: ["birthday", "party", "cone"] },
	{
		id: "thanksgiving",
		name: "Turkey",
		tags: ["thanksgiving", "turkey", "fall"],
	},
	{
		id: "four-leaf",
		name: "Four Leaf Clover",
		tags: ["lucky", "st patrick", "green"],
	},
];

function toStickerItem(holiday: HolidayRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: holiday.id }),
		provider: PROVIDER_ID,
		name: holiday.name,
		previewUrl: `${BASE_URL}/${holiday.id}.svg`,
		metadata: { tags: holiday.tags },
	};
}

export const holidayProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = HOLIDAYS.filter(
			(h) =>
				h.name.toLowerCase().includes(q) ||
				h.id.includes(q) ||
				h.tags.some((t) => t.includes(q)),
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
					items: HOLIDAYS.map(toStickerItem),
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
