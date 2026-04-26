"use client";

import { Textarea } from "@/components/ui/textarea";
import { FontPicker } from "@/components/ui/font-picker";
import type { TextElement } from "@/lib/timeline";
import { NumberField } from "@/components/ui/number-field";
import { useRef, useState } from "react";
import { SectionField, SectionFields } from "@/components/section";
import { ColorPicker } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { uppercase } from "@/utils/string";
import { clamp, formatNumberForDisplay } from "@/utils/math";
import { useEditor } from "@/hooks/use-editor";
import { CORNER_RADIUS_MAX, CORNER_RADIUS_MIN } from "@/lib/text/background";
import {
	DEFAULT_TEXT_COLOR,
	MAX_FONT_SIZE,
	MIN_FONT_SIZE,
} from "@/lib/text/typography";
import { usePropertyDraft } from "../hooks/use-property-draft";
import { useKeyframedColorProperty } from "../hooks/use-keyframed-color-property";
import { useKeyframedNumberProperty } from "../hooks/use-keyframed-number-property";
import { useElementPlayhead } from "../hooks/use-element-playhead";
import { KeyframeToggle } from "../components/keyframe-toggle";
import { isPropertyAtDefault } from "./transform-tab";
import { resolveColorAtTime, resolveNumberAtTime } from "@/lib/animation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	MinusSignIcon,
	PlusSignIcon,
	TextFontIcon,
	SparklesIcon,
	TextBoldIcon,
	TextItalicIcon,
	TextUnderlineIcon,
	TextStrikethroughIcon,
	TextAlignLeftIcon,
	TextAlignCenterIcon,
	TextAlignRightIcon,
} from "@hugeicons/core-free-icons";
import { OcTextHeightIcon, OcTextWidthIcon } from "@/components/icons";
import { DEFAULTS } from "@/lib/timeline/defaults";
import { cn } from "@/utils/ui";
import type { CaptionPreset } from "@/lib/captions/types";
import { CaptionPresetsGallery } from "../../assets/views/caption-presets-gallery";
import { usePropertiesStore } from "../stores/properties-store";
import { loadFonts } from "@/lib/fonts/google-fonts";
import { TICKS_PER_SECOND } from "@/lib/wasm";
import { rechunkCaptionElements } from "@/lib/captions/rebuild";
import { buildSubtitleTextElement } from "@/lib/subtitles/build-subtitle-text-element";
import { presetToSubtitleStyle } from "@/lib/captions";

const TABS = ["General", "Presets", "Styling"] as const;
type TextTabId = (typeof TABS)[number];

const CAPTION_TABS = ["Templates", "Styling"] as const;
type CaptionTabId = (typeof CAPTION_TABS)[number];

export function TextTab({
	element,
	trackId,
}: {
	element: TextElement;
	trackId: string;
}) {
	const hasCaption = !!element.captionStyle;
	const [activeTab, setActiveTab] = useState<TextTabId>("General");
	const [activeCaptionTab, setActiveCaptionTab] =
		useState<CaptionTabId>("Templates");
	const captionHelpers = useCaptionHelpers({ element, trackId });
	const captionStyle = captionHelpers.captionStyle;

	if (hasCaption) {
		return (
			<div className="flex h-full flex-col">
				<div className="flex border-b px-1 pt-1">
					{CAPTION_TABS.map((tab) => (
						<button
							key={tab}
							type="button"
							className={cn(
								"flex-1 rounded-t px-3 py-1.5 text-xs font-medium transition-colors",
								activeCaptionTab === tab
									? "bg-background text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setActiveCaptionTab(tab)}
						>
							{tab}
						</button>
					))}
				</div>
				<div className="flex-1 overflow-y-auto p-4">
					<CaptionTextSection element={element} trackId={trackId} />

					<div className="mb-3 grid grid-cols-2 gap-1 rounded-md border border-border/70 bg-muted/30 p-1">
						<Button
							type="button"
							size="sm"
							variant={!captionHelpers.applyToAll ? "secondary" : "ghost"}
							className="h-7 text-xs"
							onClick={() => captionHelpers.setApplyToAll(false)}
						>
							This caption
						</Button>
						<Button
							type="button"
							size="sm"
							variant={captionHelpers.applyToAll ? "secondary" : "ghost"}
							className="h-7 text-xs"
							onClick={() => captionHelpers.setApplyToAll(true)}
						>
							All captions
						</Button>
					</div>

					{activeCaptionTab === "Templates" && (
						<CaptionTemplatesContent helpers={captionHelpers} />
					)}
					{activeCaptionTab === "Styling" && captionStyle && (
						<CaptionStylingSection
							element={element}
							trackId={trackId}
							captionStyle={captionStyle}
							updateCaptionStyle={captionHelpers.updateCaptionStyle}
							updateElementStyle={captionHelpers.updateElementStyle}
						/>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex border-b px-1 pt-1">
				{TABS.map((tab) => (
					<button
						key={tab}
						type="button"
						className={cn(
							"flex-1 rounded-t px-3 py-1.5 text-xs font-medium transition-colors",
							activeTab === tab
								? "bg-background text-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
						onClick={() => setActiveTab(tab)}
					>
						{tab}
					</button>
				))}
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				{activeTab === "General" && (
					<GeneralSection element={element} trackId={trackId} />
				)}
				{activeTab === "Presets" && (
					<PresetsSection element={element} trackId={trackId} />
				)}
				{activeTab === "Styling" && (
					<StylingSection element={element} trackId={trackId} />
				)}
			</div>
		</div>
	);
}

function GeneralSection({
	element,
	trackId,
}: {
	element: TextElement;
	trackId: string;
}) {
	const editor = useEditor();
	const [isGenerating, setIsGenerating] = useState(false);
	const { localTime, isPlayheadWithinElementRange } = useElementPlayhead({
		startTime: element.startTime,
		duration: element.duration,
	});

	const content = usePropertyDraft({
		displayValue: element.content,
		parse: (input) => input,
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{ trackId, elementId: element.id, updates: { content: value } },
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	const generateAIText = async () => {
		const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "";
		const baseUrl =
			process.env.NEXT_PUBLIC_OPENAI_BASE_URL ?? "https://api.openai.com/v1";
		if (!apiKey) return;
		setIsGenerating(true);
		try {
			const response = await fetch(`${baseUrl}/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: "gpt-4.1-mini",
					messages: [
						{
							role: "system",
							content:
								"You are a creative copywriter for video text overlays. Generate short, punchy text (1-3 sentences max). Return ONLY the text content, nothing else. No quotes, no explanations.",
						},
						{
							role: "user",
							content: element.content
								? `Improve or rewrite this text for a video overlay: "${element.content}"`
								: "Generate engaging text for a video overlay.",
						},
					],
					temperature: 0.8,
					max_tokens: 150,
				}),
			});
			if (!response.ok) return;
			const data = (await response.json()) as {
				choices: Array<{ message: { content: string } }>;
			};
			const generated = data.choices?.[0]?.message?.content?.trim();
			if (generated) {
				editor.timeline.updateElements({
					updates: [
						{
							trackId,
							elementId: element.id,
							patch: { content: generated },
						},
					],
				});
			}
		} catch {
			// silent
		} finally {
			setIsGenerating(false);
		}
	};

	const resolvedTextColor = resolveColorAtTime({
		baseColor: element.color,
		animations: element.animations,
		propertyPath: "color",
		localTime,
	});

	const textColor = useKeyframedColorProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "color",
		localTime,
		isPlayheadWithinElementRange,
		resolvedColor: resolvedTextColor,
		buildBaseUpdates: ({ value }) => ({ color: value }),
	});

	const fontSize = usePropertyDraft({
		displayValue: element.fontSize.toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			if (Number.isNaN(parsed)) return null;
			return clamp({
				value: Math.round(parsed),
				min: MIN_FONT_SIZE,
				max: MAX_FONT_SIZE,
			});
		},
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{ trackId, elementId: element.id, updates: { fontSize: value } },
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	return (
		<SectionFields>
			<Textarea
				placeholder="Enter text..."
				value={content.displayValue}
				className="min-h-20"
				onFocus={content.onFocus}
				onChange={content.onChange}
				onBlur={content.onBlur}
			/>
			<Button
				variant="outline"
				size="sm"
				className="w-full"
				onClick={generateAIText}
				disabled={isGenerating}
			>
				<HugeiconsIcon
					icon={SparklesIcon}
					size={14}
					className={cn(isGenerating && "animate-spin")}
				/>
				{isGenerating ? "Generating..." : "Generate with AI"}
			</Button>
			<SectionField label="Font">
				<FontPicker
					defaultValue={element.fontFamily}
					onValueChange={(value) =>
						editor.timeline.updateElements({
							updates: [
								{
									trackId,
									elementId: element.id,
									patch: { fontFamily: value },
								},
							],
						})
					}
				/>
			</SectionField>
			<SectionField label="Size">
				<NumberField
					value={fontSize.displayValue}
					min={MIN_FONT_SIZE}
					max={MAX_FONT_SIZE}
					onFocus={fontSize.onFocus}
					onChange={fontSize.onChange}
					onBlur={fontSize.onBlur}
					onScrub={fontSize.scrubTo}
					onScrubEnd={fontSize.commitScrub}
					onReset={() =>
						editor.timeline.updateElements({
							updates: [
								{
									trackId,
									elementId: element.id,
									patch: { fontSize: DEFAULTS.text.element.fontSize },
								},
							],
						})
					}
					isDefault={element.fontSize === DEFAULTS.text.element.fontSize}
					icon={<HugeiconsIcon icon={TextFontIcon} />}
				/>
			</SectionField>
			<div className="flex items-center gap-0.5">
				<Button
					variant={element.fontWeight === "bold" ? "secondary" : "ghost"}
					size="icon"
					className="size-7"
					onClick={() =>
						editor.timeline.updateElements({
							updates: [
								{
									trackId,
									elementId: element.id,
									patch: {
										fontWeight:
											element.fontWeight === "bold" ? "normal" : "bold",
									},
								},
							],
						})
					}
					title="Bold"
				>
					<HugeiconsIcon icon={TextBoldIcon} size={14} />
				</Button>
				<Button
					variant={element.fontStyle === "italic" ? "secondary" : "ghost"}
					size="icon"
					className="size-7"
					onClick={() =>
						editor.timeline.updateElements({
							updates: [
								{
									trackId,
									elementId: element.id,
									patch: {
										fontStyle:
											element.fontStyle === "italic" ? "normal" : "italic",
									},
								},
							],
						})
					}
					title="Italic"
				>
					<HugeiconsIcon icon={TextItalicIcon} size={14} />
				</Button>
				<Button
					variant={
						element.textDecoration === "underline" ? "secondary" : "ghost"
					}
					size="icon"
					className="size-7"
					onClick={() =>
						editor.timeline.updateElements({
							updates: [
								{
									trackId,
									elementId: element.id,
									patch: {
										textDecoration:
											element.textDecoration === "underline"
												? "none"
												: "underline",
									},
								},
							],
						})
					}
					title="Underline"
				>
					<HugeiconsIcon icon={TextUnderlineIcon} size={14} />
				</Button>
				<Button
					variant={
						element.textDecoration === "line-through" ? "secondary" : "ghost"
					}
					size="icon"
					className="size-7"
					onClick={() =>
						editor.timeline.updateElements({
							updates: [
								{
									trackId,
									elementId: element.id,
									patch: {
										textDecoration:
											element.textDecoration === "line-through"
												? "none"
												: "line-through",
									},
								},
							],
						})
					}
					title="Strikethrough"
				>
					<HugeiconsIcon icon={TextStrikethroughIcon} size={14} />
				</Button>
				<div className="mx-1 h-4 w-px bg-border" />
				<Button
					variant={element.textAlign === "left" ? "secondary" : "ghost"}
					size="icon"
					className="size-7"
					onClick={() =>
						editor.timeline.updateElements({
							updates: [
								{
									trackId,
									elementId: element.id,
									patch: { textAlign: "left" },
								},
							],
						})
					}
					title="Align left"
				>
					<HugeiconsIcon icon={TextAlignLeftIcon} size={14} />
				</Button>
				<Button
					variant={element.textAlign === "center" ? "secondary" : "ghost"}
					size="icon"
					className="size-7"
					onClick={() =>
						editor.timeline.updateElements({
							updates: [
								{
									trackId,
									elementId: element.id,
									patch: { textAlign: "center" },
								},
							],
						})
					}
					title="Align center"
				>
					<HugeiconsIcon icon={TextAlignCenterIcon} size={14} />
				</Button>
				<Button
					variant={element.textAlign === "right" ? "secondary" : "ghost"}
					size="icon"
					className="size-7"
					onClick={() =>
						editor.timeline.updateElements({
							updates: [
								{
									trackId,
									elementId: element.id,
									patch: { textAlign: "right" },
								},
							],
						})
					}
					title="Align right"
				>
					<HugeiconsIcon icon={TextAlignRightIcon} size={14} />
				</Button>
			</div>
			<SectionField
				label="Color"
				beforeLabel={
					<KeyframeToggle
						isActive={textColor.isKeyframedAtTime}
						isDisabled={!isPlayheadWithinElementRange}
						title="Toggle text color keyframe"
						onToggle={textColor.toggleKeyframe}
					/>
				}
			>
				<ColorPicker
					value={uppercase({
						string: resolvedTextColor.replace("#", ""),
					})}
					onChange={(color) => textColor.onChange({ color: `#${color}` })}
					onChangeEnd={textColor.onChangeEnd}
				/>
			</SectionField>
		</SectionFields>
	);
}

function PresetsSection({
	element,
	trackId,
}: {
	element: TextElement;
	trackId: string;
}) {
	const editor = useEditor();
	const [selectedPresetId] = useState<string | null>(null);

	const handleSelectPreset = async (preset: CaptionPreset | null) => {
		if (!preset) return;
		await loadFonts({ families: [preset.style.fontFamily] });
		const { style } = preset;
		editor.timeline.previewElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: {
						fontFamily: style.fontFamily,
						fontSize: style.fontSize ?? element.fontSize,
						color: style.color,
						fontWeight: style.fontWeight,
						fontStyle: style.fontStyle,
						textAlign: style.textAlign,
						letterSpacing: style.letterSpacing ?? 0,
						lineHeight: style.lineHeight ?? 1,
						background: style.background,
						strokeColor: style.strokeColor,
						strokeWidth: style.strokeWidth,
					},
				},
			],
		});
		editor.timeline.commitPreview();
	};

	return (
		<CaptionPresetsGallery
			selectedPresetId={selectedPresetId}
			onSelectPreset={handleSelectPreset}
		/>
	);
}

function StylingSection({
	element,
	trackId,
}: {
	element: TextElement;
	trackId: string;
}) {
	const editor = useEditor();
	const lastSelectedColor = useRef(DEFAULT_TEXT_COLOR);
	const { localTime, isPlayheadWithinElementRange } = useElementPlayhead({
		startTime: element.startTime,
		duration: element.duration,
	});

	const strokeWidth = usePropertyDraft({
		displayValue: String(
			element.strokeWidth ?? DEFAULTS.text.element.strokeWidth,
		),
		parse: (input) => {
			const parsed = parseFloat(input);
			if (Number.isNaN(parsed)) return null;
			return clamp({ value: parsed, min: 0, max: 20 });
		},
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{ trackId, elementId: element.id, updates: { strokeWidth: value } },
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	const letterSpacing = usePropertyDraft({
		displayValue: Math.round(
			element.letterSpacing ?? DEFAULTS.text.letterSpacing,
		).toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			return Number.isNaN(parsed) ? null : Math.round(parsed);
		},
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{ trackId, elementId: element.id, updates: { letterSpacing: value } },
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	const lineHeight = usePropertyDraft({
		displayValue: formatNumberForDisplay({
			value: element.lineHeight ?? DEFAULTS.text.lineHeight,
			fractionDigits: 1,
		}),
		parse: (input) => {
			const parsed = parseFloat(input);
			return Number.isNaN(parsed)
				? null
				: Math.max(0.1, Math.round(parsed * 10) / 10);
		},
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{ trackId, elementId: element.id, updates: { lineHeight: value } },
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	const resolvedBgColor = resolveColorAtTime({
		baseColor: element.background.color,
		animations: element.animations,
		propertyPath: "background.color",
		localTime,
	});

	const bgColor = useKeyframedColorProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "background.color",
		localTime,
		isPlayheadWithinElementRange,
		resolvedColor: resolvedBgColor,
		buildBaseUpdates: ({ value }) => ({
			background: { ...element.background, color: value },
		}),
	});

	const bg = element.background;

	const resolvedCornerRadius = resolveNumberAtTime({
		baseValue: bg.cornerRadius ?? CORNER_RADIUS_MIN,
		animations: element.animations,
		propertyPath: "background.cornerRadius",
		localTime,
	});
	const resolvedPaddingX = resolveNumberAtTime({
		baseValue: bg.paddingX ?? DEFAULTS.text.background.paddingX,
		animations: element.animations,
		propertyPath: "background.paddingX",
		localTime,
	});
	const resolvedPaddingY = resolveNumberAtTime({
		baseValue: bg.paddingY ?? DEFAULTS.text.background.paddingY,
		animations: element.animations,
		propertyPath: "background.paddingY",
		localTime,
	});

	const cornerRadius = useKeyframedNumberProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "background.cornerRadius",
		localTime,
		isPlayheadWithinElementRange,
		displayValue: Math.round(resolvedCornerRadius).toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			if (Number.isNaN(parsed)) return null;
			return clamp({
				value: Math.round(parsed),
				min: CORNER_RADIUS_MIN,
				max: CORNER_RADIUS_MAX,
			});
		},
		valueAtPlayhead: resolvedCornerRadius,
		step: 1,
		buildBaseUpdates: ({ value }) => ({
			background: { ...bg, cornerRadius: value },
		}),
	});

	const paddingX = useKeyframedNumberProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "background.paddingX",
		localTime,
		isPlayheadWithinElementRange,
		displayValue: Math.round(resolvedPaddingX).toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			return Number.isNaN(parsed) ? null : Math.max(0, Math.round(parsed));
		},
		valueAtPlayhead: resolvedPaddingX,
		step: 1,
		buildBaseUpdates: ({ value }) => ({
			background: { ...bg, paddingX: value },
		}),
	});

	const paddingY = useKeyframedNumberProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "background.paddingY",
		localTime,
		isPlayheadWithinElementRange,
		displayValue: Math.round(resolvedPaddingY).toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			return Number.isNaN(parsed) ? null : Math.max(0, Math.round(parsed));
		},
		valueAtPlayhead: resolvedPaddingY,
		step: 1,
		buildBaseUpdates: ({ value }) => ({
			background: { ...bg, paddingY: value },
		}),
	});

	const toggleBackgroundEnabled = () => {
		const enabled = !element.background.enabled;
		const color =
			enabled && element.background.color === "transparent"
				? lastSelectedColor.current
				: element.background.color;
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					patch: { background: { ...element.background, enabled, color } },
				},
			],
		});
	};

	return (
		<SectionFields>
			<p className="text-xs font-medium text-muted-foreground">Stroke</p>
			<div className="flex items-start gap-2">
				<SectionField label="Color" className="w-1/2">
					<ColorPicker
						value={uppercase({
							string: (
								element.strokeColor ??
								DEFAULTS.text.element.strokeColor ??
								"#000000"
							).replace("#", ""),
						})}
						onChange={(color) =>
							editor.timeline.updateElements({
								updates: [
									{
										trackId,
										elementId: element.id,
										patch: { strokeColor: `#${color}` },
									},
								],
							})
						}
					/>
				</SectionField>
				<SectionField label="Width" className="w-1/2">
					<NumberField
						icon="S"
						value={strokeWidth.displayValue}
						min={0}
						max={20}
						onFocus={strokeWidth.onFocus}
						onChange={strokeWidth.onChange}
						onBlur={strokeWidth.onBlur}
						onScrub={strokeWidth.scrubTo}
						onScrubEnd={strokeWidth.commitScrub}
						onReset={() =>
							editor.timeline.updateElements({
								updates: [
									{
										trackId,
										elementId: element.id,
										patch: {
											strokeWidth: DEFAULTS.text.element.strokeWidth,
										},
									},
								],
							})
						}
						isDefault={
							(element.strokeWidth ?? DEFAULTS.text.element.strokeWidth) ===
							DEFAULTS.text.element.strokeWidth
						}
					/>
				</SectionField>
			</div>

			<div className="flex items-center justify-between">
				<p className="text-xs font-medium text-muted-foreground">Background</p>
				<Button
					variant="ghost"
					size="icon"
					className="size-6"
					onClick={toggleBackgroundEnabled}
				>
					<HugeiconsIcon
						icon={element.background.enabled ? MinusSignIcon : PlusSignIcon}
						strokeWidth={1}
						size={14}
					/>
				</Button>
			</div>
			<div
				className={cn(
					!element.background.enabled && "pointer-events-none opacity-50",
				)}
			>
				<SectionField
					label="Color"
					beforeLabel={
						<KeyframeToggle
							isActive={bgColor.isKeyframedAtTime}
							isDisabled={!isPlayheadWithinElementRange}
							title="Toggle background color keyframe"
							onToggle={bgColor.toggleKeyframe}
						/>
					}
				>
					<ColorPicker
						value={
							!element.background.enabled ||
							element.background.color === "transparent"
								? lastSelectedColor.current.replace("#", "")
								: resolvedBgColor.replace("#", "")
						}
						onChange={(color) => {
							const hexColor = `#${color}`;
							if (color !== "transparent") lastSelectedColor.current = hexColor;
							bgColor.onChange({ color: hexColor });
						}}
						onChangeEnd={bgColor.onChangeEnd}
					/>
				</SectionField>
				<SectionField
					label="Roundedness"
					beforeLabel={
						<KeyframeToggle
							isActive={cornerRadius.isKeyframedAtTime}
							isDisabled={!isPlayheadWithinElementRange}
							title="Toggle corner radius keyframe"
							onToggle={cornerRadius.toggleKeyframe}
						/>
					}
				>
					<NumberField
						icon="R"
						value={cornerRadius.displayValue}
						min={CORNER_RADIUS_MIN}
						max={CORNER_RADIUS_MAX}
						onFocus={cornerRadius.onFocus}
						onChange={cornerRadius.onChange}
						onBlur={cornerRadius.onBlur}
						onScrub={cornerRadius.scrubTo}
						onScrubEnd={cornerRadius.commitScrub}
						onReset={() =>
							cornerRadius.commitValue({ value: CORNER_RADIUS_MIN })
						}
						isDefault={isPropertyAtDefault({
							hasAnimatedKeyframes: cornerRadius.hasAnimatedKeyframes,
							isPlayheadWithinElementRange,
							resolvedValue: resolvedCornerRadius,
							staticValue: bg.cornerRadius ?? CORNER_RADIUS_MIN,
							defaultValue: CORNER_RADIUS_MIN,
						})}
					/>
				</SectionField>
				<div className="flex items-start gap-2">
					<SectionField
						label="Pad X"
						className="w-1/2"
						beforeLabel={
							<KeyframeToggle
								isActive={paddingX.isKeyframedAtTime}
								isDisabled={!isPlayheadWithinElementRange}
								title="Toggle padding X keyframe"
								onToggle={paddingX.toggleKeyframe}
							/>
						}
					>
						<NumberField
							icon="X"
							value={paddingX.displayValue}
							min={0}
							onFocus={paddingX.onFocus}
							onChange={paddingX.onChange}
							onBlur={paddingX.onBlur}
							onScrub={paddingX.scrubTo}
							onScrubEnd={paddingX.commitScrub}
							onReset={() =>
								paddingX.commitValue({
									value: DEFAULTS.text.background.paddingX,
								})
							}
							isDefault={isPropertyAtDefault({
								hasAnimatedKeyframes: paddingX.hasAnimatedKeyframes,
								isPlayheadWithinElementRange,
								resolvedValue: resolvedPaddingX,
								staticValue: bg.paddingX ?? DEFAULTS.text.background.paddingX,
								defaultValue: DEFAULTS.text.background.paddingX,
							})}
						/>
					</SectionField>
					<SectionField
						label="Pad Y"
						className="w-1/2"
						beforeLabel={
							<KeyframeToggle
								isActive={paddingY.isKeyframedAtTime}
								isDisabled={!isPlayheadWithinElementRange}
								title="Toggle padding Y keyframe"
								onToggle={paddingY.toggleKeyframe}
							/>
						}
					>
						<NumberField
							icon="Y"
							value={paddingY.displayValue}
							min={0}
							onFocus={paddingY.onFocus}
							onChange={paddingY.onChange}
							onBlur={paddingY.onBlur}
							onScrub={paddingY.scrubTo}
							onScrubEnd={paddingY.commitScrub}
							onReset={() =>
								paddingY.commitValue({
									value: DEFAULTS.text.background.paddingY,
								})
							}
							isDefault={isPropertyAtDefault({
								hasAnimatedKeyframes: paddingY.hasAnimatedKeyframes,
								isPlayheadWithinElementRange,
								resolvedValue: resolvedPaddingY,
								staticValue: bg.paddingY ?? DEFAULTS.text.background.paddingY,
								defaultValue: DEFAULTS.text.background.paddingY,
							})}
						/>
					</SectionField>
				</div>
			</div>

			<p className="text-xs font-medium text-muted-foreground">Spacing</p>
			<div className="flex items-start gap-2">
				<SectionField label="Letter" className="w-1/2">
					<NumberField
						value={letterSpacing.displayValue}
						onFocus={letterSpacing.onFocus}
						onChange={letterSpacing.onChange}
						onBlur={letterSpacing.onBlur}
						onScrub={letterSpacing.scrubTo}
						onScrubEnd={letterSpacing.commitScrub}
						onReset={() =>
							editor.timeline.updateElements({
								updates: [
									{
										trackId,
										elementId: element.id,
										patch: { letterSpacing: DEFAULTS.text.letterSpacing },
									},
								],
							})
						}
						isDefault={
							(element.letterSpacing ?? DEFAULTS.text.letterSpacing) ===
							DEFAULTS.text.letterSpacing
						}
						icon={<OcTextWidthIcon size={14} />}
					/>
				</SectionField>
				<SectionField label="Line" className="w-1/2">
					<NumberField
						value={lineHeight.displayValue}
						onFocus={lineHeight.onFocus}
						onChange={lineHeight.onChange}
						onBlur={lineHeight.onBlur}
						onScrub={lineHeight.scrubTo}
						onScrubEnd={lineHeight.commitScrub}
						onReset={() =>
							editor.timeline.updateElements({
								updates: [
									{
										trackId,
										elementId: element.id,
										patch: { lineHeight: DEFAULTS.text.lineHeight },
									},
								],
							})
						}
						isDefault={
							(element.lineHeight ?? DEFAULTS.text.lineHeight) ===
							DEFAULTS.text.lineHeight
						}
						icon={<OcTextHeightIcon size={14} />}
					/>
				</SectionField>
			</div>
		</SectionFields>
	);
}

function CaptionTextSection({
	element,
	trackId,
}: {
	element: TextElement;
	trackId: string;
}) {
	const editor = useEditor();

	const content = usePropertyDraft({
		displayValue: element.content,
		parse: (input) => input,
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{ trackId, elementId: element.id, updates: { content: value } },
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	return (
		<div className="mb-3">
			<Textarea
				value={content.displayValue}
				onChange={(e) => content.onChange(e)}
				onBlur={content.onBlur}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						content.onBlur();
					}
				}}
				rows={2}
				className="text-xs resize-none"
			/>
		</div>
	);
}

function useCaptionHelpers({
	element,
	trackId,
}: {
	element: TextElement;
	trackId: string;
}) {
	const editor = useEditor();
	const captionStyle = element.captionStyle;
	const applyToAll = usePropertiesStore((s) => s.captionApplyToAll);
	const setApplyToAll = usePropertiesStore((s) => s.setCaptionApplyToAll);
	const elementIdRef = useRef(element.id);
	elementIdRef.current = element.id;

	const resolveCurrentElement = (fallbackToAny = false): TextElement | null => {
		const track = editor.timeline.getTrackById({ trackId });
		if (!track) return null;
		const found = track.elements.find(
			(e): e is TextElement => e.id === elementIdRef.current,
		);
		if (found) return found;
		if (fallbackToAny) {
			const anyCaption = track.elements.find(
				(e): e is TextElement =>
					e.type === "text" && e.captionStyle !== undefined,
			);
			return anyCaption ?? null;
		}
		return null;
	};

	const getCaptionElements = () => {
		const track = editor.timeline.getTrackById({ trackId });
		if (!track) return [];
		return track.elements.filter(
			(e): e is TextElement =>
				e.type === "text" && e.captionStyle !== undefined,
		);
	};

	const updateCaptionStyle = (
		patch: Partial<NonNullable<typeof captionStyle>>,
	) => {
		if (!captionStyle) return;
		if (applyToAll) {
			const elems = getCaptionElements();
			editor.timeline.updateElements({
				updates: elems.map((el) => ({
					trackId,
					elementId: el.id,
					patch: {
						captionStyle: { ...(el.captionStyle ?? captionStyle), ...patch },
					},
				})),
			});
		} else {
			editor.timeline.updateElements({
				updates: [
					{
						trackId,
						elementId: element.id,
						patch: { captionStyle: { ...captionStyle, ...patch } },
					},
				],
			});
		}
	};

	const updateElementStyle = (patch: Partial<TextElement>) => {
		if (applyToAll) {
			const elems = getCaptionElements();
			editor.timeline.updateElements({
				updates: elems.map((el) => ({
					trackId,
					elementId: el.id,
					patch,
				})),
			});
		} else {
			editor.timeline.updateElements({
				updates: [{ trackId, elementId: element.id, patch }],
			});
		}
	};

	const buildStylePatch = (
		preset: CaptionPreset,
		cs: NonNullable<typeof captionStyle>,
		elem: TextElement,
	) => ({
		captionStyle: {
			...cs,
			presetId: preset.id,
			chunkMode: preset.chunkMode,
			category: preset.category,
			highlightColor: preset.style.highlightColor,
			highlightMode: preset.style.highlightMode,
			wordAnimation: preset.style.wordAnimation,
			wordAnimationDuration: preset.style.wordAnimationDuration,
			wordColorPalette: preset.style.wordColorPalette,
			highlightColorPalette: preset.style.highlightColorPalette,
		},
		color: preset.style.color,
		fontFamily: preset.style.fontFamily,
		fontWeight: preset.style.fontWeight,
		...(preset.style.fontStyle ? { fontStyle: preset.style.fontStyle } : {}),
		fontSize: preset.style.fontSize ?? elem.fontSize,
		textAlign: preset.style.textAlign,
		...(preset.style.letterSpacing !== undefined
			? { letterSpacing: preset.style.letterSpacing }
			: {}),
		...(preset.style.lineHeight !== undefined
			? { lineHeight: preset.style.lineHeight }
			: {}),
		strokeColor: preset.style.strokeColor ?? "#00000000",
		strokeWidth: preset.style.strokeWidth ?? 0,
		background: preset.style.background?.enabled
			? { ...preset.style.background }
			: { ...elem.background, enabled: false },
	});

	const regroupCaptionTrack = (preset: CaptionPreset) => {
		const current = resolveCurrentElement(true);
		const currentCs = current?.captionStyle ?? captionStyle;
		if (!currentCs) return false;
		const elems = getCaptionElements().sort(
			(a, b) => a.startTime - b.startTime,
		);
		if (elems.length === 0) return false;

		const chunks = rechunkCaptionElements({
			elements: elems,
			chunkMode: preset.chunkMode,
			ticksPerSecond: TICKS_PER_SECOND,
		});
		if (chunks.length === 0) return false;

		const toDelete = elems.map((el) => ({ trackId, elementId: el.id }));
		const base = elems[0];
		if (!base) return false;
		const canvasSize = editor.project.getActive().settings.canvasSize;
		const styleOverrides = presetToSubtitleStyle(preset);

		editor.timeline.batch(() => {
			for (const [index, chunk] of chunks.entries()) {
				const localCaptionStyle = {
					...(base.captionStyle ?? currentCs),
					...buildStylePatch(preset, base.captionStyle ?? currentCs, base)
						.captionStyle,
					wordTimings: chunk.wordTimings ?? [],
				};
				const rebuiltElement = buildSubtitleTextElement({
					index,
					caption: {
						...chunk,
						style: { ...styleOverrides },
					},
					canvasSize,
					captionStyle: localCaptionStyle,
				});

				editor.timeline.insertElement({
					placement: { mode: "explicit", trackId },
					element: {
						...base,
						...rebuiltElement,
						name: rebuiltElement.name,
					},
				});
			}

			editor.timeline.deleteElements({ elements: toDelete });
		});

		return true;
	};

	const applyPreset = (preset: CaptionPreset) => {
		loadFonts({ families: [preset.style.fontFamily] }).catch(() => {});
		const current = resolveCurrentElement(true);
		const currentCs = current?.captionStyle ?? captionStyle;
		if (!currentCs) return;
		if (regroupCaptionTrack(preset)) return;
		if (applyToAll) {
			const elems = getCaptionElements();
			editor.timeline.updateElements({
				updates: elems.map((el) => ({
					trackId,
					elementId: el.id,
					patch: buildStylePatch(preset, el.captionStyle ?? currentCs, el),
				})),
			});
		} else {
			const target = current;
			if (!target) return;
			editor.timeline.updateElements({
				updates: [
					{
						trackId,
						elementId: target.id,
						patch: buildStylePatch(
							preset,
							target.captionStyle ?? currentCs,
							target,
						),
					},
				],
			});
		}
	};

	const clearPreset = () => {
		const current = resolveCurrentElement(true);
		const currentCs = current?.captionStyle ?? captionStyle;
		if (!currentCs) return;
		const patch = {
			captionStyle: {
				...currentCs,
				presetId: null,
				highlightMode: "none" as const,
				wordAnimation: "none" as const,
				wordAnimationDuration: 0,
				wordColorPalette: [],
				highlightColorPalette: [],
			},
		} satisfies Partial<TextElement>;
		if (applyToAll) {
			const elems = getCaptionElements();
			editor.timeline.updateElements({
				updates: elems.map((el) => ({
					trackId,
					elementId: el.id,
					patch,
				})),
			});
		} else {
			const target = current;
			if (!target) return;
			editor.timeline.updateElements({
				updates: [{ trackId, elementId: target.id, patch }],
			});
		}
	};

	return {
		applyToAll,
		setApplyToAll,
		captionStyle,
		updateCaptionStyle,
		updateElementStyle,
		applyPreset,
		clearPreset,
	};
}

function CaptionTemplatesContent({
	helpers,
}: {
	helpers: ReturnType<typeof useCaptionHelpers>;
}) {
	const { captionStyle, applyPreset, clearPreset } = helpers;

	if (!captionStyle) return null;

	return (
		<CaptionPresetsGallery
			selectedPresetId={captionStyle.presetId}
			onSelectPreset={(p) => {
				if (p) void applyPreset(p);
				else clearPreset();
			}}
		/>
	);
}

function _CaptionPreviewPanel({ preset }: { preset: CaptionPreset }) {
	const style = preset.style;
	const hasBg = style.background.enabled;
	const hasStroke = (style.strokeWidth ?? 0) > 0;
	return (
		<div className="rounded-lg border bg-muted/20 p-2 md:sticky md:top-0 h-fit">
			<div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
				Preview
			</div>
			<div
				className="flex h-24 w-full items-center justify-center rounded-md px-3 overflow-hidden"
				style={{ backgroundColor: hasBg ? style.background.color : "#0a0a0a" }}
			>
				<span
					style={{
						fontFamily: `${style.fontFamily}, sans-serif`,
						fontWeight: style.fontWeight,
						fontSize: "20px",
						lineHeight: 1.05,
						color: style.color,
						textAlign: style.textAlign,
						...(hasStroke && style.strokeColor
							? {
									WebkitTextStroke: `${style.strokeWidth}px ${style.strokeColor}`,
								}
							: {}),
					}}
				>
					Sho
					<span style={{ color: style.highlightColor }}>rts</span>
				</span>
			</div>
			<div className="mt-2 text-center text-[10px] text-muted-foreground">
				{preset.name}
			</div>
		</div>
	);
}

function CaptionStylingSection({
	element,
	trackId,
	captionStyle,
	updateCaptionStyle,
	updateElementStyle,
}: {
	element: TextElement;
	trackId: string;
	captionStyle: NonNullable<TextElement["captionStyle"]>;
	updateCaptionStyle: (
		patch: Partial<NonNullable<TextElement["captionStyle"]>>,
	) => void;
	updateElementStyle: (patch: Partial<TextElement>) => void;
}) {
	const editor = useEditor();

	const fontSize = usePropertyDraft({
		displayValue: element.fontSize.toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			if (Number.isNaN(parsed)) return null;
			return clamp({
				value: Math.round(parsed),
				min: MIN_FONT_SIZE,
				max: MAX_FONT_SIZE,
			});
		},
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{ trackId, elementId: element.id, updates: { fontSize: value } },
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	const strokeWidth = usePropertyDraft({
		displayValue: (element.strokeWidth ?? 0).toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			if (Number.isNaN(parsed)) return null;
			return clamp({ value: parsed, min: 0, max: 10 });
		},
		onPreview: (value) => updateElementStyle({ strokeWidth: value }),
		onCommit: () => undefined,
	});

	const letterSpacing = usePropertyDraft({
		displayValue: Math.round(
			element.letterSpacing ?? DEFAULTS.text.letterSpacing,
		).toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			return Number.isNaN(parsed) ? null : Math.round(parsed);
		},
		onPreview: (value) => updateElementStyle({ letterSpacing: value }),
		onCommit: () => undefined,
	});

	const lineHeight = usePropertyDraft({
		displayValue: formatNumberForDisplay({
			value: element.lineHeight ?? DEFAULTS.text.lineHeight,
			fractionDigits: 1,
		}),
		parse: (input) => {
			const parsed = parseFloat(input);
			return Number.isNaN(parsed)
				? null
				: Math.max(0.1, Math.round(parsed * 10) / 10);
		},
		onPreview: (value) => updateElementStyle({ lineHeight: value }),
		onCommit: () => undefined,
	});

	const backgroundRadius = usePropertyDraft({
		displayValue: Math.round(
			element.background.cornerRadius ?? CORNER_RADIUS_MIN,
		).toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			if (Number.isNaN(parsed)) return null;
			return clamp({
				value: Math.round(parsed),
				min: CORNER_RADIUS_MIN,
				max: CORNER_RADIUS_MAX,
			});
		},
		onPreview: (value) =>
			updateElementStyle({
				background: { ...element.background, cornerRadius: value },
			}),
		onCommit: () => undefined,
	});

	const backgroundPadX = usePropertyDraft({
		displayValue: Math.round(
			element.background.paddingX ?? DEFAULTS.text.background.paddingX,
		).toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			return Number.isNaN(parsed) ? null : Math.max(0, Math.round(parsed));
		},
		onPreview: (value) =>
			updateElementStyle({
				background: { ...element.background, paddingX: value },
			}),
		onCommit: () => undefined,
	});

	const backgroundPadY = usePropertyDraft({
		displayValue: Math.round(
			element.background.paddingY ?? DEFAULTS.text.background.paddingY,
		).toString(),
		parse: (input) => {
			const parsed = parseFloat(input);
			return Number.isNaN(parsed) ? null : Math.max(0, Math.round(parsed));
		},
		onPreview: (value) =>
			updateElementStyle({
				background: { ...element.background, paddingY: value },
			}),
		onCommit: () => undefined,
	});

	return (
		<SectionFields>
			<SectionField label="Font">
				<FontPicker
					defaultValue={element.fontFamily}
					onValueChange={(value) => updateElementStyle({ fontFamily: value })}
				/>
			</SectionField>
			<SectionField label="Size">
				<NumberField
					value={fontSize.displayValue}
					min={MIN_FONT_SIZE}
					max={MAX_FONT_SIZE}
					onFocus={fontSize.onFocus}
					onChange={fontSize.onChange}
					onBlur={fontSize.onBlur}
					onScrub={fontSize.scrubTo}
					onScrubEnd={fontSize.commitScrub}
					onReset={() =>
						updateElementStyle({ fontSize: DEFAULTS.text.element.fontSize })
					}
					isDefault={element.fontSize === DEFAULTS.text.element.fontSize}
					icon={<HugeiconsIcon icon={TextFontIcon} />}
				/>
			</SectionField>
			<div className="flex items-center gap-0.5">
				<Button
					variant={element.fontWeight === "bold" ? "secondary" : "ghost"}
					size="icon"
					className="size-7"
					onClick={() =>
						updateElementStyle({
							fontWeight: element.fontWeight === "bold" ? "normal" : "bold",
						})
					}
					title="Bold"
				>
					<HugeiconsIcon icon={TextBoldIcon} size={14} />
				</Button>
				<Button
					variant={element.fontStyle === "italic" ? "secondary" : "ghost"}
					size="icon"
					className="size-7"
					onClick={() =>
						updateElementStyle({
							fontStyle: element.fontStyle === "italic" ? "normal" : "italic",
						})
					}
					title="Italic"
				>
					<HugeiconsIcon icon={TextItalicIcon} size={14} />
				</Button>
				<div className="mx-1 h-4 w-px bg-border" />
				<Button
					variant={element.textAlign === "left" ? "secondary" : "ghost"}
					size="icon"
					className="size-7"
					onClick={() => updateElementStyle({ textAlign: "left" })}
					title="Align left"
				>
					<HugeiconsIcon icon={TextAlignLeftIcon} size={14} />
				</Button>
				<Button
					variant={element.textAlign === "center" ? "secondary" : "ghost"}
					size="icon"
					className="size-7"
					onClick={() => updateElementStyle({ textAlign: "center" })}
					title="Align center"
				>
					<HugeiconsIcon icon={TextAlignCenterIcon} size={14} />
				</Button>
				<Button
					variant={element.textAlign === "right" ? "secondary" : "ghost"}
					size="icon"
					className="size-7"
					onClick={() => updateElementStyle({ textAlign: "right" })}
					title="Align right"
				>
					<HugeiconsIcon icon={TextAlignRightIcon} size={14} />
				</Button>
			</div>
			<SectionField label="Text Color">
				<ColorPicker
					value={uppercase({ string: element.color.replace("#", "") })}
					onChange={(color) => updateElementStyle({ color: `#${color}` })}
				/>
			</SectionField>
			<SectionField label="Highlight">
				<ColorPicker
					value={captionStyle.highlightColor}
					onChange={(color) => updateCaptionStyle({ highlightColor: color })}
				/>
			</SectionField>
			<SectionField label="Stroke">
				<div className="flex items-center gap-2">
					<ColorPicker
						value={uppercase({
							string: (element.strokeColor ?? "#000000").replace("#", ""),
						})}
						onChange={(color) =>
							updateElementStyle({ strokeColor: `#${color}` })
						}
					/>
					<NumberField
						value={strokeWidth.displayValue}
						min={0}
						max={10}
						onFocus={strokeWidth.onFocus}
						onChange={strokeWidth.onChange}
						onBlur={strokeWidth.onBlur}
						onScrub={strokeWidth.scrubTo}
						onScrubEnd={strokeWidth.commitScrub}
						className="w-16"
					/>
				</div>
			</SectionField>
			<SectionField label="Background">
				<div className="flex items-center gap-2">
					<Button
						variant={element.background?.enabled ? "secondary" : "ghost"}
						size="sm"
						className="h-7 text-xs"
						onClick={() =>
							updateElementStyle({
								background: {
									...element.background,
									enabled: !element.background?.enabled,
								},
							})
						}
					>
						{element.background?.enabled ? "On" : "Off"}
					</Button>
					{element.background?.enabled && (
						<ColorPicker
							value={uppercase({
								string: (element.background?.color ?? "#000000").replace(
									"#",
									"",
								),
							})}
							onChange={(color) =>
								updateElementStyle({
									background: { ...element.background, color: `#${color}` },
								})
							}
						/>
					)}
				</div>
			</SectionField>
			<div className="flex items-start gap-2">
				<SectionField label="Letter" className="w-1/2">
					<NumberField
						value={letterSpacing.displayValue}
						onFocus={letterSpacing.onFocus}
						onChange={letterSpacing.onChange}
						onBlur={letterSpacing.onBlur}
						onScrub={letterSpacing.scrubTo}
						onScrubEnd={letterSpacing.commitScrub}
						icon={<OcTextWidthIcon size={14} />}
					/>
				</SectionField>
				<SectionField label="Line" className="w-1/2">
					<NumberField
						value={lineHeight.displayValue}
						onFocus={lineHeight.onFocus}
						onChange={lineHeight.onChange}
						onBlur={lineHeight.onBlur}
						onScrub={lineHeight.scrubTo}
						onScrubEnd={lineHeight.commitScrub}
						icon={<OcTextHeightIcon size={14} />}
					/>
				</SectionField>
			</div>
			{element.background.enabled && (
				<div className="flex items-start gap-2">
					<SectionField label="Radius" className="w-1/3">
						<NumberField
							value={backgroundRadius.displayValue}
							min={CORNER_RADIUS_MIN}
							max={CORNER_RADIUS_MAX}
							onFocus={backgroundRadius.onFocus}
							onChange={backgroundRadius.onChange}
							onBlur={backgroundRadius.onBlur}
							onScrub={backgroundRadius.scrubTo}
							onScrubEnd={backgroundRadius.commitScrub}
						/>
					</SectionField>
					<SectionField label="Pad X" className="w-1/3">
						<NumberField
							value={backgroundPadX.displayValue}
							onFocus={backgroundPadX.onFocus}
							onChange={backgroundPadX.onChange}
							onBlur={backgroundPadX.onBlur}
							onScrub={backgroundPadX.scrubTo}
							onScrubEnd={backgroundPadX.commitScrub}
						/>
					</SectionField>
					<SectionField label="Pad Y" className="w-1/3">
						<NumberField
							value={backgroundPadY.displayValue}
							onFocus={backgroundPadY.onFocus}
							onChange={backgroundPadY.onChange}
							onBlur={backgroundPadY.onBlur}
							onScrub={backgroundPadY.scrubTo}
							onScrubEnd={backgroundPadY.commitScrub}
						/>
					</SectionField>
				</div>
			)}
		</SectionFields>
	);
}

function _CaptionPresetCard({
	preset,
	isSelected,
	onClick,
}: {
	preset: CaptionPreset;
	isSelected: boolean;
	onClick: () => void;
}) {
	const style = preset.style;
	const hasBg = style.background.enabled;
	const hasStroke = (style.strokeWidth ?? 0) > 0;

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"group flex flex-col items-center gap-0.5 rounded-lg border p-1.5 transition-all text-left",
				isSelected
					? "border-primary bg-primary/10"
					: "border-border hover:border-primary/50",
			)}
		>
			<div
				className="flex h-10 w-full items-center justify-center rounded-md px-2 overflow-hidden"
				style={{
					backgroundColor: hasBg ? style.background.color : "#0a0a0a",
				}}
			>
				<span
					className="transition-transform duration-200 group-hover:scale-110"
					style={{
						fontFamily: `${style.fontFamily}, sans-serif`,
						fontWeight: style.fontWeight,
						fontSize: "13px",
						lineHeight: 1.2,
						color: style.color,
						...(hasStroke && style.strokeColor
							? {
									WebkitTextStroke: `${style.strokeWidth}px ${style.strokeColor}`,
								}
							: {}),
					}}
				>
					{"Ca"}
					<span style={{ color: style.highlightColor }}>{"p"}</span>
					{"tions"}
				</span>
			</div>
			<span className="text-muted-foreground w-full text-[9px] truncate text-center">
				{preset.name}
			</span>
		</button>
	);
}
