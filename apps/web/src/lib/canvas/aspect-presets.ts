export const ASPECT_PRESETS = {
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "1:1": 1,
  "4:5": 4 / 5,
  "4:3": 4 / 3,
  "21:9": 21 / 9,
} as const;

export type AspectPresetKey = keyof typeof ASPECT_PRESETS;
