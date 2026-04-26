import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "food";
const BASE_URL = "/stickers/food";

interface FoodRecord {
	id: string;
	name: string;
	tags: string[];
}

const FOODS: FoodRecord[] = [
	{ id: "pizza", name: "Pizza", tags: ["slice", "italian", "cheese"] },
	{ id: "burger", name: "Burger", tags: ["hamburger", "beef"] },
	{ id: "taco", name: "Taco", tags: ["mexican", "shell"] },
	{ id: "sushi", name: "Sushi", tags: ["japanese", "roll", "fish"] },
	{ id: "donut", name: "Donut", tags: ["doughnut", "sweet", "icing"] },
	{ id: "ice-cream", name: "Ice Cream", tags: ["cone", "frozen", "sweet"] },
	{ id: "cake", name: "Cake", tags: ["birthday", "slice", "sweet"] },
	{ id: "cookie", name: "Cookie", tags: ["chocolate", "chip", "sweet"] },
	{ id: "cupcake", name: "Cupcake", tags: ["frosting", "sweet"] },
	{ id: "popcorn", name: "Popcorn", tags: ["movie", "snack"] },
	{ id: "hotdog", name: "Hot Dog", tags: ["frankfurt", "mustard"] },
	{ id: "fries", name: "French Fries", tags: ["chips", "potato"] },
	{ id: "ramen", name: "Ramen", tags: ["noodle", "soup", "japanese"] },
	{ id: "pancake", name: "Pancake", tags: ["breakfast", "syrup", "stack"] },
	{ id: "waffle", name: "Waffle", tags: ["breakfast", "berries"] },
	{ id: "coffee", name: "Coffee", tags: ["espresso", "latte", "morning"] },
	{ id: "bubble-tea", name: "Bubble Tea", tags: ["boba", "tapioca", "milk"] },
	{ id: "smoothie", name: "Smoothie", tags: ["fruit", "healthy", "blend"] },
	{ id: "soda", name: "Soda", tags: ["drink", "fizzy", "cola"] },
	{ id: "watermelon", name: "Watermelon", tags: ["fruit", "summer", "fresh"] },
	{ id: "strawberry", name: "Strawberry", tags: ["fruit", "berry", "red"] },
	{ id: "avocado", name: "Avocado", tags: ["green", "healthy", "toast"] },
	{ id: "apple", name: "Apple", tags: ["fruit", "red", "healthy"] },
	{ id: "banana", name: "Banana", tags: ["fruit", "yellow"] },
	{ id: "cherry", name: "Cherry", tags: ["fruit", "red", "pair"] },
	{ id: "pineapple", name: "Pineapple", tags: ["fruit", "tropical"] },
	{ id: "candy", name: "Candy", tags: ["sweet", "wrapper"] },
	{ id: "lollipop", name: "Lollipop", tags: ["sweet", "swirl", "candy"] },
	{ id: "chocolate", name: "Chocolate", tags: ["bar", "sweet", "cocoa"] },
	{ id: "fries-burger", name: "Burger & Fries", tags: ["combo", "meal"] },
];

function toStickerItem(food: FoodRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: food.id }),
		provider: PROVIDER_ID,
		name: food.name,
		previewUrl: `${BASE_URL}/${food.id}.svg`,
		metadata: { tags: food.tags },
	};
}

export const foodProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = FOODS.filter(
			(f) =>
				f.name.toLowerCase().includes(q) ||
				f.id.includes(q) ||
				f.tags.some((t) => t.includes(q)),
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
					items: FOODS.map(toStickerItem),
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
