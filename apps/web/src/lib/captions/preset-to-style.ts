import type { CaptionPreset } from "./types";
import type { SubtitleStyleOverrides } from "@/lib/subtitles/types";

export function presetToSubtitleStyle(
	preset: CaptionPreset,
): SubtitleStyleOverrides {
	return {
		fontFamily: preset.style.fontFamily,
		fontSize: preset.style.fontSize,
		color: preset.style.color,
		fontWeight: preset.style.fontWeight,
		fontStyle: preset.style.fontStyle,
		textAlign: preset.style.textAlign,
		letterSpacing: preset.style.letterSpacing,
		lineHeight: preset.style.lineHeight,
		placement: preset.style.placement,
		background: preset.style.background,
		...(preset.style.strokeColor
			? { strokeColor: preset.style.strokeColor }
			: {}),
		...(preset.style.strokeWidth
			? { strokeWidth: preset.style.strokeWidth }
			: {}),
	};
}
