const SCENE_EFFECT_TYPES = new Set<string>(["blur-background"]);

export function isSceneEffectType(effectType: string): boolean {
	return SCENE_EFFECT_TYPES.has(effectType);
}

export function isClipFilterEffectType(effectType: string): boolean {
	return !isSceneEffectType(effectType);
}
