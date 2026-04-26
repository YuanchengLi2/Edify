import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "animals";
const BASE_URL = "/stickers/animals";

interface AnimalRecord {
	id: string;
	name: string;
	tags: string[];
}

const ANIMALS: AnimalRecord[] = [
	{ id: "cat", name: "Cat", tags: ["kitty", "feline", "cute"] },
	{ id: "dog", name: "Dog", tags: ["puppy", "canine", "pup"] },
	{ id: "rabbit", name: "Rabbit", tags: ["bunny", "ears"] },
	{ id: "bear", name: "Bear", tags: ["teddy", "grizzly"] },
	{ id: "panda", name: "Panda", tags: ["bamboo", "black", "white"] },
	{ id: "fox", name: "Fox", tags: ["sly", "orange"] },
	{ id: "owl", name: "Owl", tags: ["wise", "bird", "night"] },
	{ id: "penguin", name: "Penguin", tags: ["ice", "cold", "cute"] },
	{ id: "unicorn", name: "Unicorn", tags: ["rainbow", "magic", "horn"] },
	{ id: "dinosaur", name: "Dinosaur", tags: ["dino", "trex", "jurassic"] },
	{ id: "frog", name: "Frog", tags: ["green", "amphibian"] },
	{ id: "monkey", name: "Monkey", tags: ["ape", "banana"] },
	{ id: "pig", name: "Pig", tags: ["pink", "oink", "farm"] },
	{ id: "lion", name: "Lion", tags: ["king", "mane", "jungle"] },
	{ id: "tiger", name: "Tiger", tags: ["stripes", "wild", "orange"] },
	{ id: "koala", name: "Koala", tags: ["australia", "gray", "eucalyptus"] },
	{ id: "hamster", name: "Hamster", tags: ["small", "cute", "pet"] },
	{ id: "dolphin", name: "Dolphin", tags: ["ocean", "jump", "blue"] },
	{ id: "butterfly", name: "Butterfly", tags: ["wings", "colorful", "insect"] },
	{ id: "turtle", name: "Turtle", tags: ["slow", "shell", "green"] },
	{ id: "fish", name: "Fish", tags: ["ocean", "tropical", "swim"] },
	{ id: "octopus", name: "Octopus", tags: ["tentacle", "sea", "purple"] },
	{ id: "bee", name: "Bee", tags: ["honey", "buzz", "yellow"] },
	{ id: "ladybug", name: "Ladybug", tags: ["red", "spots", "insect"] },
	{ id: "whale", name: "Whale", tags: ["ocean", "blue", "big"] },
	{ id: "parrot", name: "Parrot", tags: ["bird", "colorful", "talk"] },
	{ id: "elephant", name: "Elephant", tags: ["trunk", "big", "gray"] },
	{ id: "giraffe", name: "Giraffe", tags: ["tall", "spots", "yellow"] },
	{
		id: "penguin-love",
		name: "Penguin Love",
		tags: ["love", "couple", "heart"],
	},
	{
		id: "cat-space",
		name: "Space Cat",
		tags: ["space", "astronaut", "galaxy"],
	},
];

function toStickerItem(animal: AnimalRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: animal.id }),
		provider: PROVIDER_ID,
		name: animal.name,
		previewUrl: `${BASE_URL}/${animal.id}.svg`,
		metadata: { tags: animal.tags },
	};
}

export const animalsProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = ANIMALS.filter(
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
					items: ANIMALS.map(toStickerItem),
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
