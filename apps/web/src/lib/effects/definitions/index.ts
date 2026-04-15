import { effectsRegistry } from "../registry";
import { blurEffectDefinition } from "./blur";
import { vignetteEffectDefinition } from "./vignette";
import { sharpenEffectDefinition } from "./sharpen";
import { filmGrainEffectDefinition } from "./film-grain";
import { glowEffectDefinition } from "./glow";
import { chromaticAberrationEffectDefinition } from "./chromatic-aberration";
import { glitchEffectDefinition } from "./glitch";
import { zoomPunchEffectDefinition } from "./zoom-punch";
import { blurBackgroundEffectDefinition } from "./blur-background";
import { clarityEffectDefinition } from "./clarity";

const defaultEffects = [
	blurEffectDefinition,
	vignetteEffectDefinition,
	sharpenEffectDefinition,
	filmGrainEffectDefinition,
	glowEffectDefinition,
	chromaticAberrationEffectDefinition,
	glitchEffectDefinition,
	zoomPunchEffectDefinition,
	blurBackgroundEffectDefinition,
	clarityEffectDefinition,
];

export function registerDefaultEffects(): void {
	for (const definition of defaultEffects) {
		if (effectsRegistry.has(definition.type)) {
			continue;
		}
		effectsRegistry.register(definition.type, definition);
	}
}
