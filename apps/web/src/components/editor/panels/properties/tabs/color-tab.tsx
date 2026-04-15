import { useEditor } from "@/hooks/use-editor";
import { Slider } from "@/components/ui/slider";
import type { VideoElement, ImageElement } from "@/lib/timeline";
import type { ColorSettings } from "@/lib/color/types";
import {
	Section,
	SectionContent,
	SectionFields,
	SectionField,
	SectionHeader,
	SectionTitle,
} from "@/components/section";
import { useCallback } from "react";

type ColorableElement = VideoElement | ImageElement;

const COLOR_FIELDS: {
	key: keyof ColorSettings;
	label: string;
}[] = [
	{ key: "exposure", label: "Exposure" },
	{ key: "contrast", label: "Contrast" },
	{ key: "saturation", label: "Saturation" },
	{ key: "temperature", label: "Temperature" },
	{ key: "highlights", label: "Highlights" },
	{ key: "shadows", label: "Shadows" },
	{ key: "whites", label: "Whites" },
	{ key: "blacks", label: "Blacks" },
	{ key: "tint", label: "Tint" },
	{ key: "vibrance", label: "Vibrance" },
];

const DEFAULT_COLOR_SETTINGS: ColorSettings = {
	exposure: 0,
	contrast: 0,
	saturation: 0,
	temperature: 0,
	highlights: 0,
	shadows: 0,
	whites: 0,
	blacks: 0,
	tint: 0,
	vibrance: 0,
};

export function ColorTab({
	element,
	trackId,
}: {
	element: ColorableElement;
	trackId: string;
}) {
	const editor = useEditor();

	const settings = element.colorSettings ?? { ...DEFAULT_COLOR_SETTINGS };

	const updateSetting = useCallback(
		(key: keyof ColorSettings, value: number) => {
			const updated: ColorSettings = { ...settings, [key]: value };
			editor.timeline.updateElements({
				updates: [
					{
						trackId,
						elementId: element.id,
						patch: { colorSettings: updated },
					},
				],
			});
		},
		[editor, trackId, element.id, settings],
	);

	const resetSettings = useCallback(() => {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					patch: { colorSettings: { ...DEFAULT_COLOR_SETTINGS } },
				},
			],
		});
	}, [editor, trackId, element.id]);

	return (
		<Section collapsible sectionKey={`${element.id}:color`}>
			<SectionHeader>
				<SectionTitle>Color</SectionTitle>
			</SectionHeader>
			<SectionContent>
				<SectionFields>
					{COLOR_FIELDS.map(({ key, label }) => (
						<ColorSlider
							key={key}
							label={label}
							value={settings[key]}
							onChange={(v) => updateSetting(key, v)}
						/>
					))}
					<button
						type="button"
						className="text-muted-foreground hover:text-foreground text-xs transition-colors"
						onClick={resetSettings}
					>
						Reset all
					</button>
				</SectionFields>
			</SectionContent>
		</Section>
	);
}

function ColorSlider({
	label,
	value,
	onChange,
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
}) {
	return (
		<SectionField label={`${label}: ${value}`}>
			<Slider
				min={-100}
				max={100}
				step={1}
				value={[value]}
				onValueChange={([v]) => onChange(v)}
			/>
		</SectionField>
	);
}
