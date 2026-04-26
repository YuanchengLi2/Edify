import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "decorations";
const BASE_URL = "/stickers/decorations";

interface DecoRecord {
	id: string;
	name: string;
	tags: string[];
}

const DECORATIONS: DecoRecord[] = [
	{ id: "sparkle-1", name: "Sparkle", tags: ["shine", "star", "glitter"] },
	{ id: "sparkle-2", name: "Sparkle Star", tags: ["shine", "star"] },
	{ id: "sparkle-3", name: "Sparkle Dots", tags: ["dots", "shine"] },
	{
		id: "confetti",
		name: "Confetti",
		tags: ["party", "celebrate", "colorful"],
	},
	{
		id: "hearts-float",
		name: "Floating Hearts",
		tags: ["hearts", "love", "float"],
	},
	{ id: "stars-scatter", name: "Scattered Stars", tags: ["stars", "scatter"] },
	{ id: "snowflakes", name: "Snowflakes", tags: ["winter", "snow", "cold"] },
	{ id: "hearts-rain", name: "Hearts Rain", tags: ["hearts", "rain", "love"] },
	{ id: "butterflies", name: "Butterflies", tags: ["nature", "wings", "fly"] },
	{ id: "flowers", name: "Flowers", tags: ["nature", "floral", "bloom"] },
	{ id: "ribbon", name: "Ribbon", tags: ["banner", "decoration"] },
	{
		id: "frame-corner",
		name: "Corner Frame",
		tags: ["frame", "corner", "border"],
	},
	{ id: "frame-full", name: "Full Frame", tags: ["frame", "border"] },
	{ id: "light-leak", name: "Light Leak", tags: ["lens", "flare", "light"] },
	{ id: "bokeh", name: "Bokeh", tags: ["blur", "circles", "light"] },
	{
		id: "glitter",
		name: "Glitter Trail",
		tags: ["glitter", "sparkle", "trail"],
	},
	{ id: "swirl", name: "Swirl", tags: ["spiral", "decoration"] },
	{
		id: "doodle-arrow",
		name: "Doodle Arrow",
		tags: ["hand", "drawn", "sketch"],
	},
	{ id: "doodle-star", name: "Doodle Star", tags: ["hand", "drawn", "sketch"] },
	{
		id: "doodle-circle",
		name: "Doodle Circle",
		tags: ["hand", "drawn", "sketch"],
	},
	{
		id: "doodle-underline",
		name: "Doodle Underline",
		tags: ["hand", "drawn", "underline"],
	},
	{ id: "neon-glow", name: "Neon Glow", tags: ["neon", "glow", "ring"] },
	{
		id: "paint-splash",
		name: "Paint Splash",
		tags: ["paint", "color", "splash"],
	},
	{ id: "ink-drip", name: "Ink Drip", tags: ["ink", "drip", "dark"] },
	{ id: "halftone", name: "Halftone", tags: ["dots", "pattern", "retro"] },
];

function toStickerItem(deco: DecoRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: deco.id }),
		provider: PROVIDER_ID,
		name: deco.name,
		previewUrl: `${BASE_URL}/${deco.id}.svg`,
		metadata: { tags: deco.tags },
	};
}

export const decorationsProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = DECORATIONS.filter(
			(d) =>
				d.name.toLowerCase().includes(q) ||
				d.id.includes(q) ||
				d.tags.some((t) => t.includes(q)),
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
					items: DECORATIONS.map(toStickerItem),
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
