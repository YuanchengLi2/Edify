import { stickersRegistry } from "../registry";
import type { StickerProvider } from "@/lib/stickers/types";
import { flagsProvider } from "./flags";
import { logosProvider } from "./logos";
import { shapesProvider } from "./shapes";
import { emojisProvider } from "./emojis";
import { arrowsProvider } from "./arrows";
import { bubblesProvider } from "./bubbles";
import { socialProvider } from "./social";
import { decorationsProvider } from "./decorations";
import { badgesProvider } from "./badges";
import { animalsProvider } from "./animals";
import { foodProvider } from "./food";
import { gamingProvider } from "./gaming";
import { comicProvider } from "./comic";
import { weatherProvider } from "./weather";
import { holidayProvider } from "./holiday";

const defaultProviders: StickerProvider[] = [
	logosProvider,
	flagsProvider,
	shapesProvider,
	emojisProvider,
	arrowsProvider,
	bubblesProvider,
	socialProvider,
	animalsProvider,
	foodProvider,
	comicProvider,
	gamingProvider,
	decorationsProvider,
	badgesProvider,
	weatherProvider,
	holidayProvider,
];

export function registerDefaultStickerProviders({
	providersToRegister = defaultProviders,
}: {
	providersToRegister?: StickerProvider[];
} = {}): void {
	for (const provider of providersToRegister) {
		if (stickersRegistry.has(provider.id)) {
			continue;
		}
		stickersRegistry.register(provider.id, provider);
	}
}
