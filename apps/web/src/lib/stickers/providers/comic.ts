import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "comic";
const BASE_URL = "/stickers/comic";

interface ComicRecord {
	id: string;
	name: string;
	tags: string[];
}

const COMICS: ComicRecord[] = [
	{ id: "pow", name: "POW!", tags: ["explosion", "impact", "fight"] },
	{ id: "bam", name: "BAM!", tags: ["explosion", "impact"] },
	{ id: "boom", name: "BOOM!", tags: ["explosion", "loud"] },
	{ id: "wham", name: "WHAM!", tags: ["impact", "hit"] },
	{ id: "zap", name: "ZAP!", tags: ["lightning", "electric"] },
	{ id: "crash", name: "CRASH!", tags: ["impact", "destroy"] },
	{ id: "smash", name: "SMASH!", tags: ["break", "hulk"] },
	{ id: "pop", name: "POP!", tags: ["bubble", "burst"] },
	{ id: "wow-text", name: "WOW!", tags: ["amazing", "surprise"] },
	{ id: "yeah", name: "YEAH!", tags: ["celebrate", "yes"] },
	{ id: "cool-text", name: "COOL!", tags: ["awesome", "chill"] },
	{ id: "omg", name: "OMG", tags: ["surprise", "shock"] },
	{ id: "nope", name: "NOPE", tags: ["no", "reject", "deny"] },
	{ id: "yay", name: "YAY!", tags: ["celebrate", "happy"] },
	{ id: "oops", name: "OOPS!", tags: ["mistake", "sorry"] },
	{ id: "epic", name: "EPIC", tags: ["amazing", "fire", "legend"] },
	{ id: "lol", name: "LOL", tags: ["laugh", "funny"] },
	{ id: "bruh", name: "BRUH", tags: ["seriously", "deadpan"] },
	{ id: "sheesh", name: "SHEESH", tags: ["cold", "impressive"] },
	{ id: "slay", name: "SLAY", tags: ["queen", "boss", "amazing"] },
	{ id: "w-text", name: "W", tags: ["win", "winner", "victory"] },
	{ id: "l-text", name: "L", tags: ["lose", "loser", "loss"] },
	{ id: "goat", name: "GOAT", tags: ["greatest", "legend", "best"] },
	{ id: "vibe", name: "VIBE", tags: ["mood", "chill", "music"] },
	{ id: "facts", name: "FACTS", tags: ["true", "real", "check"] },
	{ id: "fire-text", name: "FIRE", tags: ["hot", "lit", "trending"] },
	{ id: "drip", name: "DRIP", tags: ["style", "cool", "water"] },
	{ id: "sigma", name: "SIGMA", tags: ["alpha", "grindset"] },
	{ id: "pog", name: "POG", tags: ["hype", "excited", "twitch"] },
	{ id: "based", name: "BASED", tags: ["real", "facts", "truth"] },
];

function toStickerItem(comic: ComicRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: comic.id }),
		provider: PROVIDER_ID,
		name: comic.name,
		previewUrl: `${BASE_URL}/${comic.id}.svg`,
		metadata: { tags: comic.tags },
	};
}

export const comicProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = COMICS.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				c.id.includes(q) ||
				c.tags.some((t) => t.includes(q)),
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
					items: COMICS.map(toStickerItem),
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
