import type { EffectDefinition } from "@/lib/effects/types";

const presetParams = [
	{
		key: "speed",
		label: "Speed",
		type: "number",
		default: 55,
		min: 0,
		max: 100,
		step: 1,
		shortLabel: "S",
	},
	{
		key: "color",
		label: "Color",
		type: "number",
		default: 80,
		min: 0,
		max: 100,
		step: 1,
		shortLabel: "C",
	},
	{
		key: "strength",
		label: "Strength",
		type: "number",
		default: 72,
		min: 0,
		max: 100,
		step: 1,
		shortLabel: "P",
	},
	{
		key: "glow",
		label: "Glow",
		type: "number",
		default: 68,
		min: 0,
		max: 100,
		step: 1,
		shortLabel: "G",
	},
	{
		key: "blur",
		label: "Blur",
		type: "number",
		default: 8,
		min: 0,
		max: 100,
		step: 1,
		shortLabel: "B",
	},
] as const;

function buildPresetDefinition({
	type,
	name,
	keywords,
}: {
	type: string;
	name: string;
	keywords: string[];
}): EffectDefinition {
	return {
		type,
		name,
		keywords,
		params: [...presetParams],
		renderer: { passes: [] },
	};
}

export const presetPackEffectDefinitions: EffectDefinition[] = [
	buildPresetDefinition({
		type: "flash",
		name: "Flash",
		keywords: ["flash", "bright", "pop", "burst"],
	}),
	buildPresetDefinition({
		type: "soft-glow",
		name: "Soft Glow",
		keywords: ["soft", "glow", "beauty", "light"],
	}),
	buildPresetDefinition({
		type: "dreamy",
		name: "Dreamy",
		keywords: ["dreamy", "soft", "mist", "haze"],
	}),
	buildPresetDefinition({
		type: "halo",
		name: "Halo",
		keywords: ["halo", "shine", "glow", "bloom"],
	}),
	buildPresetDefinition({
		type: "haze",
		name: "Haze",
		keywords: ["haze", "fog", "mist", "air"],
	}),
	buildPresetDefinition({
		type: "frost",
		name: "Frost",
		keywords: ["frost", "cold", "cool", "icy"],
	}),
	buildPresetDefinition({
		type: "noir-soft",
		name: "Noir Soft",
		keywords: ["noir", "soft", "cinematic", "moody"],
	}),
	buildPresetDefinition({
		type: "pulse",
		name: "Pulse",
		keywords: ["pulse", "energy", "vivid", "punch"],
	}),
	buildPresetDefinition({
		type: "drift",
		name: "Drift",
		keywords: ["drift", "float", "motion", "soft"],
	}),
	buildPresetDefinition({
		type: "bloom-plus",
		name: "Bloom+",
		keywords: ["bloom", "bright", "shine", "highlight"],
	}),
	buildPresetDefinition({
		type: "velvet",
		name: "Velvet",
		keywords: ["velvet", "soft", "portrait", "smooth"],
	}),
	buildPresetDefinition({
		type: "retro-pop",
		name: "Retro Pop",
		keywords: ["retro", "pop", "bold", "vintage"],
	}),
	buildPresetDefinition({
		type: "ice-pop",
		name: "Ice Pop",
		keywords: ["ice", "cool", "clean", "blue"],
	}),
	buildPresetDefinition({
		type: "sunset",
		name: "Sunset",
		keywords: ["sunset", "warm", "gold", "orange"],
	}),
	buildPresetDefinition({
		type: "mono-fade",
		name: "Mono Fade",
		keywords: ["mono", "fade", "gray", "film"],
	}),
	buildPresetDefinition({
		type: "amber",
		name: "Amber",
		keywords: ["amber", "warm", "golden", "honey"],
	}),
	buildPresetDefinition({
		type: "cyberpunk",
		name: "Cyberpunk",
		keywords: ["cyberpunk", "neon", "edgy", "futuristic"],
	}),
	buildPresetDefinition({
		type: "vhs",
		name: "VHS",
		keywords: ["vhs", "retro", "tape", "analog"],
	}),
	buildPresetDefinition({
		type: "polaroid",
		name: "Polaroid",
		keywords: ["polaroid", "instant", "vintage", "wash"],
	}),
	buildPresetDefinition({
		type: "cinematic",
		name: "Cinematic",
		keywords: ["cinematic", "movie", "film", "dramatic"],
	}),
	buildPresetDefinition({
		type: "teal-orange",
		name: "Teal Orange",
		keywords: ["teal", "orange", "blockbuster", "color"],
	}),
	buildPresetDefinition({
		type: "desaturate",
		name: "Desaturate",
		keywords: ["desaturate", "muted", "flat", "subtle"],
	}),
	buildPresetDefinition({
		type: "neon",
		name: "Neon",
		keywords: ["neon", "bright", "electric", "glow"],
	}),
	buildPresetDefinition({
		type: "matte",
		name: "Matte",
		keywords: ["matte", "flat", "film", "fade"],
	}),
	buildPresetDefinition({
		type: "lomo",
		name: "Lomo",
		keywords: ["lomo", "saturated", "vintage", "contrast"],
	}),
	buildPresetDefinition({
		type: "infrared",
		name: "Infrared",
		keywords: ["infrared", "thermal", "heat", "false color"],
	}),
	buildPresetDefinition({
		type: "sepia-film",
		name: "Sepia Film",
		keywords: ["sepia", "old", "antique", "aged"],
	}),
	buildPresetDefinition({
		type: "pastel",
		name: "Pastel",
		keywords: ["pastel", "soft", "light", "candy"],
	}),
	buildPresetDefinition({
		type: "contrast-pop",
		name: "Contrast Pop",
		keywords: ["contrast", "pop", "bold", "crisp"],
	}),
];
