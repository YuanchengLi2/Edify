import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "emojis";
const BASE_URL = "/stickers/emojis";

interface EmojiRecord {
	id: string;
	name: string;
	tags: string[];
}

const EMOJIS: EmojiRecord[] = [
	{ id: "smile", name: "Smile", tags: ["happy", "face", "grin"] },
	{ id: "laugh", name: "Laugh", tags: ["funny", "lol", "haha"] },
	{ id: "sad", name: "Sad", tags: ["unhappy", "cry", "face"] },
	{ id: "cool", name: "Cool", tags: ["sunglasses", "awesome"] },
	{ id: "heart-eyes", name: "Heart Eyes", tags: ["love", "adore"] },
	{ id: "wink", name: "Wink", tags: ["flirt", "face"] },
	{ id: "angry", name: "Angry", tags: ["mad", "rage", "face"] },
	{ id: "surprised", name: "Surprised", tags: ["shock", "wow", "face"] },
	{ id: "tongue", name: "Tongue Out", tags: ["silly", "playful"] },
	{ id: "crying", name: "Crying", tags: ["tears", "sad"] },
	{ id: "fire", name: "Fire", tags: ["hot", "lit", "flame"] },
	{ id: "thumbs-up", name: "Thumbs Up", tags: ["like", "approve", "good"] },
	{ id: "star-eyes", name: "Star Eyes", tags: ["amazed", "excited"] },
	{ id: "party", name: "Party", tags: ["celebrate", "birthday", "fun"] },
	{ id: "mind-blown", name: "Mind Blown", tags: ["shocked", "amazing"] },
	{ id: "100", name: "100", tags: ["perfect", "hundred", "score"] },
	{ id: "check", name: "Check", tags: ["done", "yes", "correct"] },
	{ id: "x-mark", name: "X Mark", tags: ["no", "wrong", "cancel"] },
	{ id: "warning", name: "Warning", tags: ["alert", "caution"] },
	{ id: "flex", name: "Flex", tags: ["muscle", "strong", "arm"] },
	{ id: "crown", name: "Crown", tags: ["king", "queen", "royal"] },
	{ id: "lightning", name: "Lightning", tags: ["fast", "electric", "bolt"] },
	{ id: "rocket", name: "Rocket", tags: ["launch", "fast", "space"] },
	{ id: "sparkle", name: "Sparkle", tags: ["shine", "glitter", "star"] },
	{ id: "eyes", name: "Eyes", tags: ["look", "see", "watch"] },
];

function toStickerItem(emoji: EmojiRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: emoji.id }),
		provider: PROVIDER_ID,
		name: emoji.name,
		previewUrl: `${BASE_URL}/${emoji.id}.svg`,
		metadata: { tags: emoji.tags },
	};
}

export const emojisProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = EMOJIS.filter(
			(e) =>
				e.name.toLowerCase().includes(q) ||
				e.id.includes(q) ||
				e.tags.some((t) => t.includes(q)),
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
					items: EMOJIS.map(toStickerItem),
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
