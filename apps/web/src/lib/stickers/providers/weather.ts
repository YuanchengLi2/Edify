import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "weather";
const BASE_URL = "/stickers/weather";

interface WeatherRecord {
	id: string;
	name: string;
	tags: string[];
}

const WEATHER: WeatherRecord[] = [
	{ id: "sun", name: "Sun", tags: ["bright", "sunny", "hot"] },
	{ id: "sun-cloud", name: "Partly Cloudy", tags: ["cloudy", "mild"] },
	{ id: "cloud", name: "Cloud", tags: ["cloudy", "overcast"] },
	{ id: "rain", name: "Rain", tags: ["wet", "drizzle", "drop"] },
	{ id: "heavy-rain", name: "Heavy Rain", tags: ["storm", "downpour"] },
	{ id: "thunder", name: "Thunderstorm", tags: ["lightning", "storm"] },
	{ id: "snow", name: "Snow", tags: ["winter", "cold", "flake"] },
	{ id: "wind", name: "Wind", tags: ["breezy", "gust", "blow"] },
	{ id: "rainbow", name: "Rainbow", tags: ["colorful", "arc", "pride"] },
	{ id: "fog", name: "Fog", tags: ["mist", "haze", "low"] },
	{ id: "tornado", name: "Tornado", tags: ["twister", "storm", "wind"] },
	{ id: "stars-night", name: "Night Sky", tags: ["stars", "moon", "dark"] },
	{ id: "moon", name: "Moon", tags: ["crescent", "night", "lunar"] },
	{ id: "sunrise", name: "Sunrise", tags: ["morning", "dawn"] },
	{ id: "sunset", name: "Sunset", tags: ["evening", "dusk", "warm"] },
	{
		id: "thermometer-hot",
		name: "Hot",
		tags: ["temperature", "warm", "summer"],
	},
	{
		id: "thermometer-cold",
		name: "Cold",
		tags: ["temperature", "freezing", "winter"],
	},
	{ id: "umbrella", name: "Umbrella", tags: ["rain", "protect"] },
	{ id: "drop", name: "Water Drop", tags: ["rain", "aqua", "blue"] },
	{ id: "wave", name: "Wave", tags: ["ocean", "surf", "sea"] },
	{ id: "mountain", name: "Mountain", tags: ["peak", "nature", "hike"] },
	{ id: "tree", name: "Tree", tags: ["nature", "forest", "green"] },
	{ id: "leaf", name: "Leaf", tags: ["autumn", "fall", "nature"] },
	{ id: "flower-sun", name: "Sunflower", tags: ["yellow", "nature", "bloom"] },
	{ id: "aurora", name: "Aurora", tags: ["northern", "lights", "green"] },
];

function toStickerItem(w: WeatherRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: w.id }),
		provider: PROVIDER_ID,
		name: w.name,
		previewUrl: `${BASE_URL}/${w.id}.svg`,
		metadata: { tags: w.tags },
	};
}

export const weatherProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = WEATHER.filter(
			(w) =>
				w.name.toLowerCase().includes(q) ||
				w.id.includes(q) ||
				w.tags.some((t) => t.includes(q)),
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
					items: WEATHER.map(toStickerItem),
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
