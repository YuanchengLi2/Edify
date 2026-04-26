import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
	StickerBrowseResult,
	StickerItem,
	StickerProvider,
	StickerSearchResult,
} from "../types";

const PROVIDER_ID = "gaming";
const BASE_URL = "/stickers/gaming";

interface GameRecord {
	id: string;
	name: string;
	tags: string[];
}

const GAMES: GameRecord[] = [
	{ id: "controller", name: "Controller", tags: ["gamepad", "play"] },
	{ id: "headset", name: "Headset", tags: ["mic", "audio", "gamer"] },
	{ id: "joystick", name: "Joystick", tags: ["arcade", "retro"] },
	{
		id: "pixel-heart",
		name: "Pixel Heart",
		tags: ["minecraft", "love", "pixel"],
	},
	{ id: "pixel-star", name: "Pixel Star", tags: ["pixel", "retro"] },
	{ id: "game-over", name: "Game Over", tags: ["lose", "end", "retro"] },
	{ id: "level-up", name: "Level Up", tags: ["upgrade", "progress"] },
	{ id: "winner", name: "Winner", tags: ["win", "champion"] },
	{ id: "combo", name: "Combo", tags: ["chain", "hits", "fire"] },
	{ id: "gg", name: "GG", tags: ["good", "game"] },
	{ id: "loot", name: "Loot", tags: ["chest", "treasure", "reward"] },
	{ id: "sword", name: "Sword", tags: ["weapon", "rpg", "fantasy"] },
	{ id: "shield-game", name: "Shield", tags: ["defense", "rpg"] },
	{ id: "potion", name: "Potion", tags: ["magic", "health", "rpg"] },
	{ id: "coin", name: "Coin", tags: ["gold", "money", "collect"] },
	{ id: "diamond", name: "Diamond", tags: ["gem", "rare", "minecraft"] },
	{ id: "crown-game", name: "Crown", tags: ["king", "winner"] },
	{ id: "skull", name: "Skull", tags: ["death", "danger"] },
	{ id: "dragon", name: "Dragon", tags: ["boss", "fantasy", "fire"] },
	{ id: "alien", name: "Alien", tags: ["space", "invader", "retro"] },
	{ id: "pacman", name: "Pac-Man", tags: ["retro", "arcade", "yellow"] },
	{ id: "ghost", name: "Ghost", tags: ["pacman", "retro", "arcade"] },
	{ id: "bomb", name: "Bomb", tags: ["explosion", "danger"] },
	{ id: "target", name: "Target", tags: ["crosshair", "aim", "shoot"] },
	{ id: "health-bar", name: "Health Bar", tags: ["hp", "life", "bar"] },
	{ id: "xp-bar", name: "XP Bar", tags: ["experience", "progress"] },
	{ id: "trophy-game", name: "Trophy", tags: ["achievement", "award"] },
	{ id: "dice", name: "Dice", tags: ["roll", "random", "dnd"] },
	{ id: "card-spade", name: "Ace of Spades", tags: ["card", "poker", "luck"] },
	{
		id: "joystick-arcade",
		name: "Arcade",
		tags: ["machine", "retro", "gaming"],
	},
];

function toStickerItem(game: GameRecord): StickerItem {
	return {
		id: buildStickerId({ providerId: PROVIDER_ID, providerValue: game.id }),
		provider: PROVIDER_ID,
		name: game.name,
		previewUrl: `${BASE_URL}/${game.id}.svg`,
		metadata: { tags: game.tags },
	};
}

export const gamingProvider: StickerProvider = {
	id: PROVIDER_ID,
	async search({
		query,
	}: {
		query: string;
		options?: { limit?: number };
	}): Promise<StickerSearchResult> {
		const q = query.trim().toLowerCase();
		const matched = GAMES.filter(
			(g) =>
				g.name.toLowerCase().includes(q) ||
				g.id.includes(q) ||
				g.tags.some((t) => t.includes(q)),
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
					items: GAMES.map(toStickerItem),
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
