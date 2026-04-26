import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "arrows";
const BASE_URL = "/stickers/arrows";

interface ArrowRecord {
	id: string;
	name: string;
	tags: string[];
}

const ARROWS: ArrowRecord[] = [
	{ id: "right", name: "Arrow Right", tags: ["point", "next"] },
	{ id: "left", name: "Arrow Left", tags: ["point", "back"] },
	{ id: "up", name: "Arrow Up", tags: ["point", "top"] },
	{ id: "down", name: "Arrow Down", tags: ["point", "bottom"] },
	{ id: "right-curvy", name: "Curvy Right", tags: ["curve", "swoosh"] },
	{ id: "left-curvy", name: "Curvy Left", tags: ["curve", "swoosh"] },
	{ id: "bounce-right", name: "Bounce Right", tags: ["animated", "spring"] },
	{ id: "bounce-left", name: "Bounce Left", tags: ["animated", "spring"] },
	{
		id: "circle-arrow",
		name: "Cycle Arrow",
		tags: ["rotate", "refresh", "loop"],
	},
	{ id: "double-right", name: "Double Right", tags: ["fast", "forward"] },
	{ id: "hand-point-right", name: "Hand Right", tags: ["point", "hand"] },
	{ id: "hand-point-left", name: "Hand Left", tags: ["point", "hand"] },
	{ id: "hand-point-up", name: "Hand Up", tags: ["point", "hand"] },
	{ id: "hand-point-down", name: "Hand Down", tags: ["point", "hand"] },
	{ id: "neon-right", name: "Neon Right", tags: ["glow", "neon"] },
	{ id: "neon-left", name: "Neon Left", tags: ["glow", "neon"] },
	{ id: "ribbon-right", name: "Ribbon Right", tags: ["banner", "label"] },
	{ id: "ribbon-left", name: "Ribbon Left", tags: ["banner", "label"] },
	{ id: "arrow-swoosh", name: "Swoosh", tags: ["trail", "fast"] },
	{ id: "arrow-dotted", name: "Dotted Arrow", tags: ["path", "dotted"] },
];

function toStickerItem(arrow: ArrowRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: arrow.id }),
		provider: PROVIDER_ID,
		name: arrow.name,
		previewUrl: `${BASE_URL}/${arrow.id}.svg`,
		metadata: { tags: arrow.tags },
	};
}

export const arrowsProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = ARROWS.filter(
			(a) =>
				a.name.toLowerCase().includes(q) ||
				a.id.includes(q) ||
				a.tags.some((t) => t.includes(q)),
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
					items: ARROWS.map(toStickerItem),
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
