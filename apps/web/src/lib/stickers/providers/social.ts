import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "social";
const BASE_URL = "/stickers/social";

interface SocialRecord {
	id: string;
	name: string;
	tags: string[];
}

const SOCIALS: SocialRecord[] = [
	{ id: "like", name: "Like", tags: ["thumbs", "up", "approve"] },
	{ id: "heart", name: "Heart", tags: ["love", "favorite"] },
	{ id: "comment", name: "Comment", tags: ["chat", "reply"] },
	{ id: "share", name: "Share", tags: ["forward", "send"] },
	{ id: "subscribe", name: "Subscribe", tags: ["sub", "bell"] },
	{ id: "follow", name: "Follow", tags: ["add", "connect"] },
	{ id: "notification", name: "Notification", tags: ["bell", "alert"] },
	{
		id: "subscribe-bell",
		name: "Subscribe Bell",
		tags: ["sub", "bell", "notify"],
	},
	{ id: "camera", name: "Camera", tags: ["photo", "picture"] },
	{ id: "video", name: "Video", tags: ["record", "film"] },
	{ id: "music", name: "Music", tags: ["note", "song", "audio"] },
	{ id: "hashtag", name: "Hashtag", tags: ["#", "tag", "trending"] },
	{ id: "@-symbol", name: "@ Symbol", tags: ["at", "mention", "tag"] },
	{ id: "live", name: "LIVE", tags: ["stream", "broadcast"] },
	{ id: "dm", name: "Direct Message", tags: ["mail", "message", "inbox"] },
	{ id: "trending", name: "Trending", tags: ["chart", "popular", "up"] },
	{ id: "viral", name: "Viral", tags: ["spread", "popular", "trend"] },
	{ id: "fire-post", name: "Fire Post", tags: ["hot", "trending", "fire"] },
	{ id: "new-badge", name: "New Badge", tags: ["fresh", "latest"] },
	{ id: "verified", name: "Verified", tags: ["check", "badge", "official"] },
	{ id: "story", name: "Story", tags: ["ring", "circle", "stories"] },
	{ id: "reel", name: "Reel", tags: ["clapperboard", "video", "short"] },
	{ id: "streaming", name: "Streaming", tags: ["play", "live", "signal"] },
	{ id: "podcast", name: "Podcast", tags: ["mic", "audio", "talk"] },
	{ id: "collab", name: "Collab", tags: ["team", "people", "together"] },
];

function toStickerItem(social: SocialRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: social.id }),
		provider: PROVIDER_ID,
		name: social.name,
		previewUrl: `${BASE_URL}/${social.id}.svg`,
		metadata: { tags: social.tags },
	};
}

export const socialProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = SOCIALS.filter(
			(s) =>
				s.name.toLowerCase().includes(q) ||
				s.id.includes(q) ||
				s.tags.some((t) => t.includes(q)),
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
					items: SOCIALS.map(toStickerItem),
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
