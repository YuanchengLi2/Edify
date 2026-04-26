import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "badges";
const BASE_URL = "/stickers/badges";

interface BadgeRecord {
	id: string;
	name: string;
	tags: string[];
}

const BADGES: BadgeRecord[] = [
	{
		id: "ribbon-badge",
		name: "Ribbon Badge",
		tags: ["award", "ribbon", "gold"],
	},
	{ id: "star-badge", name: "Star Badge", tags: ["star", "gold", "award"] },
	{ id: "circle-badge", name: "Circle Badge", tags: ["seal", "circle"] },
	{ id: "shield", name: "Shield", tags: ["protect", "security"] },
	{ id: "stamp", name: "Stamp", tags: ["approved", "rubber"] },
	{ id: "sale-tag", name: "Sale Tag", tags: ["price", "tag", "sale"] },
	{ id: "new-ribbon", name: "NEW", tags: ["new", "fresh", "ribbon"] },
	{ id: "sale-badge", name: "SALE", tags: ["sale", "discount", "red"] },
	{ id: "hot-badge", name: "HOT", tags: ["hot", "fire", "trending"] },
	{ id: "premium", name: "Premium", tags: ["crown", "star", "vip"] },
	{ id: "best-seller", name: "Best Seller", tags: ["popular", "ribbon"] },
	{ id: "top-rated", name: "Top Rated", tags: ["star", "rating", "top"] },
	{ id: "limited", name: "Limited", tags: ["limited", "rare"] },
	{ id: "exclusive", name: "Exclusive", tags: ["exclusive", "special"] },
	{ id: "free", name: "FREE", tags: ["free", "green", "gift"] },
	{ id: "discount", name: "50% OFF", tags: ["discount", "sale", "off"] },
	{ id: "sold-out", name: "Sold Out", tags: ["sold", "gone"] },
	{ id: "featured", name: "Featured", tags: ["star", "featured", "highlight"] },
	{ id: "trophy", name: "Trophy", tags: ["winner", "cup", "gold"] },
	{ id: "medal", name: "Medal", tags: ["medal", "ribbon", "award"] },
	{ id: "certificate", name: "Certificate", tags: ["seal", "official"] },
	{
		id: "arrow-banner",
		name: "Arrow Banner",
		tags: ["banner", "arrow", "label"],
	},
	{ id: "number-1", name: "1st Place", tags: ["gold", "first", "winner"] },
	{ id: "number-2", name: "2nd Place", tags: ["silver", "second"] },
	{ id: "number-3", name: "3rd Place", tags: ["bronze", "third"] },
];

function toStickerItem(badge: BadgeRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: badge.id }),
		provider: PROVIDER_ID,
		name: badge.name,
		previewUrl: `${BASE_URL}/${badge.id}.svg`,
		metadata: { tags: badge.tags },
	};
}

export const badgesProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = BADGES.filter(
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
					items: BADGES.map(toStickerItem),
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
