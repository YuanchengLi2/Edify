export const ASPECT_PRESETS = {
	"16:9": 16 / 9,
	"9:16": 9 / 16,
	"1:1": 1,
	"4:5": 4 / 5,
	"4:3": 4 / 3,
	"21:9": 21 / 9,
} as const;

export const ASPECT_PRESET_SIZES = {
	"16:9": { width: 1920, height: 1080 },
	"9:16": { width: 1080, height: 1920 },
	"1:1": { width: 1080, height: 1080 },
	"4:5": { width: 1080, height: 1350 },
	"4:3": { width: 1440, height: 1080 },
	"21:9": { width: 2520, height: 1080 },
} as const;

export type AspectPresetKey = keyof typeof ASPECT_PRESETS;
