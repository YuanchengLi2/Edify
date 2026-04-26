import { NumberField } from "@/components/ui/number-field";
import { useEditor } from "@/hooks/use-editor";
import { clamp, isNearlyEqual } from "@/utils/math";
import type { VisualElement } from "@/lib/timeline";
import {
	Section,
	SectionContent,
	SectionField,
	SectionFields,
	SectionHeader,
	SectionTitle,
} from "@/components/section";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowExpandIcon,
	Link05Icon,
	RotateClockwiseIcon,
	RefreshIcon,
	ImageFlipHorizontalIcon,
	ImageFlipVerticalIcon,
	LayoutAlignLeftIcon,
	LayoutAlignRightIcon,
	LayoutAlignTopIcon,
	LayoutAlignBottomIcon,
	AlignHorizontalCenterIcon,
	AlignVerticalCenterIcon,
} from "@hugeicons/core-free-icons";
import {
	getGroupKeyframesAtTime,
	hasGroupKeyframeAtTime,
	resolveTransformAtTime,
} from "@/lib/animation";
import { DEFAULTS } from "@/lib/timeline/defaults";
import { useElementPlayhead } from "../hooks/use-element-playhead";
import { KeyframeToggle } from "../components/keyframe-toggle";
import { useKeyframedNumberProperty } from "../hooks/use-keyframed-number-property";
import { usePropertiesStore } from "../stores/properties-store";
import { STICKER_INTRINSIC_SIZE_FALLBACK } from "@/lib/stickers/intrinsic-size";
import { DEFAULT_GRAPHIC_SOURCE_SIZE } from "@/lib/graphics";

export function parseNumericInput({ input }: { input: string }): number | null {
	const parsed = parseFloat(input);
	return Number.isNaN(parsed) ? null : parsed;
}

export function isPropertyAtDefault({
	hasAnimatedKeyframes,
	isPlayheadWithinElementRange,
	resolvedValue,
	staticValue,
	defaultValue,
}: {
	hasAnimatedKeyframes: boolean;
	isPlayheadWithinElementRange: boolean;
	resolvedValue: number;
	staticValue: number;
	defaultValue: number;
}): boolean {
	if (hasAnimatedKeyframes && isPlayheadWithinElementRange) {
		return isNearlyEqual({
			leftValue: resolvedValue,
			rightValue: defaultValue,
		});
	}

	return staticValue === defaultValue;
}

function getElementSourceDimensions({
	element,
	mediaAssets,
	canvasWidth,
	canvasHeight,
}: {
	element: VisualElement;
	mediaAssets: { id: string; width?: number; height?: number }[];
	canvasWidth: number;
	canvasHeight: number;
}): { sourceWidth: number; sourceHeight: number } {
	if (element.type === "video" || element.type === "image") {
		const asset = mediaAssets.find((a) => a.id === element.mediaId);
		return {
			sourceWidth: asset?.width ?? canvasWidth,
			sourceHeight: asset?.height ?? canvasHeight,
		};
	}
	if (element.type === "sticker") {
		return {
			sourceWidth: element.intrinsicWidth ?? STICKER_INTRINSIC_SIZE_FALLBACK,
			sourceHeight: element.intrinsicHeight ?? STICKER_INTRINSIC_SIZE_FALLBACK,
		};
	}
	if (element.type === "graphic") {
		return {
			sourceWidth: DEFAULT_GRAPHIC_SOURCE_SIZE,
			sourceHeight: DEFAULT_GRAPHIC_SOURCE_SIZE,
		};
	}
	return { sourceWidth: canvasWidth, sourceHeight: canvasHeight };
}

export function TransformTab({
	element,
	trackId,
}: {
	element: VisualElement;
	trackId: string;
}) {
	const editor = useEditor();
	const isScaleLocked = usePropertiesStore((s) => s.isTransformScaleLocked);
	const setTransformScaleLocked = usePropertiesStore(
		(s) => s.setTransformScaleLocked,
	);
	const canvasSize = useEditor(
		(e) => e.project.getActive().settings.canvasSize,
	);
	const mediaAssets = useEditor((e) => e.media.getAssets());
	const { localTime, isPlayheadWithinElementRange } = useElementPlayhead({
		startTime: element.startTime,
		duration: element.duration,
	});
	const resolvedTransform = resolveTransformAtTime({
		baseTransform: element.transform,
		animations: element.animations,
		localTime,
	});

	const canvasWidth = canvasSize?.width ?? 1920;
	const canvasHeight = canvasSize?.height ?? 1080;

	const { sourceWidth, sourceHeight } = getElementSourceDimensions({
		element,
		mediaAssets,
		canvasWidth,
		canvasHeight,
	});
	const containScale = Math.min(
		canvasWidth / sourceWidth,
		canvasHeight / sourceHeight,
	);
	const renderedWidth = sourceWidth * containScale * resolvedTransform.scaleX;
	const renderedHeight = sourceHeight * containScale * resolvedTransform.scaleY;

	const positionX = useKeyframedNumberProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "transform.positionX",
		localTime,
		isPlayheadWithinElementRange,
		displayValue: Math.round(resolvedTransform.position.x).toString(),
		parse: (input) => parseNumericInput({ input }),
		valueAtPlayhead: resolvedTransform.position.x,
		step: 1,
		buildBaseUpdates: ({ value }) => ({
			transform: {
				...element.transform,
				position: { ...element.transform.position, x: value },
			},
		}),
	});

	const positionY = useKeyframedNumberProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "transform.positionY",
		localTime,
		isPlayheadWithinElementRange,
		displayValue: Math.round(resolvedTransform.position.y).toString(),
		parse: (input) => parseNumericInput({ input }),
		valueAtPlayhead: resolvedTransform.position.y,
		step: 1,
		buildBaseUpdates: ({ value }) => ({
			transform: {
				...element.transform,
				position: { ...element.transform.position, y: value },
			},
		}),
	});

	const parseScale = (input: string) => {
		const parsed = parseNumericInput({ input });
		if (parsed === null) return null;
		return parsed / 100;
	};

	const scaleX = useKeyframedNumberProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "transform.scaleX",
		localTime,
		isPlayheadWithinElementRange,
		displayValue: Math.round(resolvedTransform.scaleX * 100).toString(),
		parse: parseScale,
		valueAtPlayhead: resolvedTransform.scaleX,
		step: 0.01,
		buildBaseUpdates: ({ value }) => ({
			transform: {
				...element.transform,
				scaleX: value,
				...(isScaleLocked ? { scaleY: value } : {}),
			},
		}),
		buildAdditionalKeyframes: isScaleLocked
			? ({ value }) => [{ propertyPath: "transform.scaleY", value }]
			: undefined,
	});

	const scaleY = useKeyframedNumberProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "transform.scaleY",
		localTime,
		isPlayheadWithinElementRange,
		displayValue: Math.round(resolvedTransform.scaleY * 100).toString(),
		parse: parseScale,
		valueAtPlayhead: resolvedTransform.scaleY,
		step: 0.01,
		buildBaseUpdates: ({ value }) => ({
			transform: {
				...element.transform,
				scaleY: value,
				...(isScaleLocked ? { scaleX: value } : {}),
			},
		}),
		buildAdditionalKeyframes: isScaleLocked
			? ({ value }) => [{ propertyPath: "transform.scaleX", value }]
			: undefined,
	});

	const scaleFieldPropsX = {
		value: scaleX.displayValue,
		onFocus: scaleX.onFocus,
		onChange: scaleX.onChange,
		onBlur: scaleX.onBlur,
		dragSensitivity: "slow" as const,
		onScrub: scaleX.scrubTo,
		onScrubEnd: scaleX.commitScrub,
		onReset: () =>
			scaleX.commitValue({ value: DEFAULTS.element.transform.scaleX }),
		isDefault: isPropertyAtDefault({
			hasAnimatedKeyframes: scaleX.hasAnimatedKeyframes,
			isPlayheadWithinElementRange,
			resolvedValue: resolvedTransform.scaleX,
			staticValue: element.transform.scaleX,
			defaultValue: DEFAULTS.element.transform.scaleX,
		}),
	};

	const scaleFieldPropsY = {
		value: scaleY.displayValue,
		onFocus: scaleY.onFocus,
		onChange: scaleY.onChange,
		onBlur: scaleY.onBlur,
		dragSensitivity: "slow" as const,
		onScrub: scaleY.scrubTo,
		onScrubEnd: scaleY.commitScrub,
		onReset: () =>
			scaleY.commitValue({ value: DEFAULTS.element.transform.scaleY }),
		isDefault: isPropertyAtDefault({
			hasAnimatedKeyframes: scaleY.hasAnimatedKeyframes,
			isPlayheadWithinElementRange,
			resolvedValue: resolvedTransform.scaleY,
			staticValue: element.transform.scaleY,
			defaultValue: DEFAULTS.element.transform.scaleY,
		}),
	};

	const rotation = useKeyframedNumberProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "transform.rotate",
		localTime,
		isPlayheadWithinElementRange,
		displayValue: Math.round(resolvedTransform.rotate).toString(),
		parse: (input) => {
			const parsed = parseNumericInput({ input });
			if (parsed === null) return null;
			return clamp({ value: parsed, min: -360, max: 360 });
		},
		valueAtPlayhead: resolvedTransform.rotate,
		step: 1,
		buildBaseUpdates: ({ value }) => ({
			transform: {
				...element.transform,
				rotate: value,
			},
		}),
	});

	const opacity = useKeyframedNumberProperty({
		trackId,
		elementId: element.id,
		animations: element.animations,
		propertyPath: "opacity",
		localTime,
		isPlayheadWithinElementRange,
		displayValue: Math.round(element.opacity * 100).toString(),
		parse: (input) => {
			const parsed = parseNumericInput({ input });
			if (parsed === null) return null;
			return clamp({ value: parsed / 100, min: 0, max: 1 });
		},
		valueAtPlayhead: element.opacity,
		step: 0.01,
		buildBaseUpdates: ({ value }) => ({
			opacity: value,
		}),
	});

	const hasScaleKeyframe = hasGroupKeyframeAtTime({
		animations: element.animations,
		group: "transform.scale",
		time: localTime,
	});

	const toggleScaleKeyframe = () => {
		if (!isPlayheadWithinElementRange) return;
		const existing = getGroupKeyframesAtTime({
			animations: element.animations,
			group: "transform.scale",
			time: localTime,
		});
		if (existing.length > 0) {
			editor.timeline.removeKeyframes({
				keyframes: existing.map((ref) => ({
					trackId,
					elementId: element.id,
					...ref,
				})),
			});
			return;
		}
		editor.timeline.upsertKeyframes({
			keyframes: [
				{
					trackId,
					elementId: element.id,
					propertyPath: "transform.scaleX",
					time: localTime,
					value: resolvedTransform.scaleX,
				},
				{
					trackId,
					elementId: element.id,
					propertyPath: "transform.scaleY",
					time: localTime,
					value: resolvedTransform.scaleY,
				},
			],
		});
	};

	const scaleLockButton = (
		<Button
			type="button"
			variant={isScaleLocked ? "secondary" : "ghost"}
			size="icon"
			aria-pressed={isScaleLocked}
			onClick={() => setTransformScaleLocked(!isScaleLocked)}
		>
			<HugeiconsIcon icon={Link05Icon} />
		</Button>
	);

	const updateTransform = (positionX: number, positionY: number) => {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					patch: {
						transform: {
							...element.transform,
							position: { x: positionX, y: positionY },
						},
					},
				},
			],
		});
	};

	const handleResetTransform = () => {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					patch: {
						transform: {
							...DEFAULTS.element.transform,
							position: { ...DEFAULTS.element.transform.position },
						},
						opacity: DEFAULTS.element.opacity,
					},
				},
			],
		});
	};

	const handleFlipHorizontal = () => {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					patch: {
						transform: {
							...element.transform,
							scaleX: -element.transform.scaleX,
						},
					},
				},
			],
		});
	};

	const handleFlipVertical = () => {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					patch: {
						transform: {
							...element.transform,
							scaleY: -element.transform.scaleY,
						},
					},
				},
			],
		});
	};

	const handleAlignLeft = () =>
		updateTransform(
			renderedWidth / 2 - canvasWidth / 2,
			resolvedTransform.position.y,
		);
	const handleAlignCenterH = () =>
		updateTransform(0, resolvedTransform.position.y);
	const handleAlignRight = () =>
		updateTransform(
			canvasWidth / 2 - renderedWidth / 2,
			resolvedTransform.position.y,
		);
	const handleAlignTop = () =>
		updateTransform(
			resolvedTransform.position.x,
			renderedHeight / 2 - canvasHeight / 2,
		);
	const handleAlignCenterV = () =>
		updateTransform(resolvedTransform.position.x, 0);
	const handleAlignBottom = () =>
		updateTransform(
			resolvedTransform.position.x,
			canvasHeight / 2 - renderedHeight / 2,
		);

	return (
		<Section collapsible sectionKey={`${element.id}:transform`}>
			<SectionHeader
				trailing={
					<div className="flex items-center gap-0.5">
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={handleFlipHorizontal}
							title="Flip Horizontal"
						>
							<HugeiconsIcon icon={ImageFlipHorizontalIcon} size={14} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={handleFlipVertical}
							title="Flip Vertical"
						>
							<HugeiconsIcon icon={ImageFlipVerticalIcon} size={14} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={handleResetTransform}
							title="Reset Transform"
						>
							<HugeiconsIcon icon={RefreshIcon} size={14} />
						</Button>
					</div>
				}
			>
				<SectionTitle>Transform</SectionTitle>
			</SectionHeader>
			<SectionContent>
				<SectionFields>
					<div className="flex items-center justify-center gap-0.5">
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={handleAlignLeft}
							title="Align Left"
						>
							<HugeiconsIcon icon={LayoutAlignLeftIcon} size={14} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={handleAlignCenterV}
							title="Align Center Vertical"
						>
							<HugeiconsIcon icon={AlignVerticalCenterIcon} size={14} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={handleAlignRight}
							title="Align Right"
						>
							<HugeiconsIcon icon={LayoutAlignRightIcon} size={14} />
						</Button>
						<div className="mx-1 h-4 w-px bg-border" />
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={handleAlignTop}
							title="Align Top"
						>
							<HugeiconsIcon icon={LayoutAlignTopIcon} size={14} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={handleAlignCenterH}
							title="Align Center Horizontal"
						>
							<HugeiconsIcon icon={AlignHorizontalCenterIcon} size={14} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={handleAlignBottom}
							title="Align Bottom"
						>
							<HugeiconsIcon icon={LayoutAlignBottomIcon} size={14} />
						</Button>
					</div>

					<div className="flex items-end gap-2">
						{isScaleLocked ? (
							<>
								<SectionField
									label="Scale"
									className="min-w-0 flex-1"
									beforeLabel={
										<KeyframeToggle
											isActive={hasScaleKeyframe}
											isDisabled={!isPlayheadWithinElementRange}
											title="Toggle scale keyframe"
											onToggle={toggleScaleKeyframe}
										/>
									}
								>
									<NumberField
										icon={<HugeiconsIcon icon={ArrowExpandIcon} />}
										{...scaleFieldPropsX}
									/>
								</SectionField>
								{scaleLockButton}
							</>
						) : (
							<>
								<SectionField
									label="Width"
									className="min-w-0 flex-1"
									beforeLabel={
										<KeyframeToggle
											isActive={scaleX.isKeyframedAtTime}
											isDisabled={!isPlayheadWithinElementRange}
											title="Toggle width scale keyframe"
											onToggle={scaleX.toggleKeyframe}
										/>
									}
								>
									<NumberField icon="W" {...scaleFieldPropsX} />
								</SectionField>
								{scaleLockButton}
								<SectionField
									label="Height"
									className="min-w-0 flex-1"
									beforeLabel={
										<KeyframeToggle
											isActive={scaleY.isKeyframedAtTime}
											isDisabled={!isPlayheadWithinElementRange}
											title="Toggle height scale keyframe"
											onToggle={scaleY.toggleKeyframe}
										/>
									}
								>
									<NumberField icon="H" {...scaleFieldPropsY} />
								</SectionField>
							</>
						)}
					</div>
					<div className="flex items-end gap-2">
						<SectionField
							label="X"
							className="min-w-0 flex-1"
							beforeLabel={
								<KeyframeToggle
									isActive={positionX.isKeyframedAtTime}
									isDisabled={!isPlayheadWithinElementRange}
									title="Toggle X position keyframe"
									onToggle={positionX.toggleKeyframe}
								/>
							}
						>
							<NumberField
								icon="X"
								value={positionX.displayValue}
								onFocus={positionX.onFocus}
								onChange={positionX.onChange}
								onBlur={positionX.onBlur}
								onScrub={positionX.scrubTo}
								onScrubEnd={positionX.commitScrub}
								onReset={() =>
									positionX.commitValue({
										value: DEFAULTS.element.transform.position.x,
									})
								}
								isDefault={isPropertyAtDefault({
									hasAnimatedKeyframes: positionX.hasAnimatedKeyframes,
									isPlayheadWithinElementRange,
									resolvedValue: resolvedTransform.position.x,
									staticValue: element.transform.position.x,
									defaultValue: DEFAULTS.element.transform.position.x,
								})}
							/>
						</SectionField>
						<SectionField
							label="Y"
							className="min-w-0 flex-1"
							beforeLabel={
								<KeyframeToggle
									isActive={positionY.isKeyframedAtTime}
									isDisabled={!isPlayheadWithinElementRange}
									title="Toggle Y position keyframe"
									onToggle={positionY.toggleKeyframe}
								/>
							}
						>
							<NumberField
								icon="Y"
								value={positionY.displayValue}
								onFocus={positionY.onFocus}
								onChange={positionY.onChange}
								onBlur={positionY.onBlur}
								onScrub={positionY.scrubTo}
								onScrubEnd={positionY.commitScrub}
								onReset={() =>
									positionY.commitValue({
										value: DEFAULTS.element.transform.position.y,
									})
								}
								isDefault={isPropertyAtDefault({
									hasAnimatedKeyframes: positionY.hasAnimatedKeyframes,
									isPlayheadWithinElementRange,
									resolvedValue: resolvedTransform.position.y,
									staticValue: element.transform.position.y,
									defaultValue: DEFAULTS.element.transform.position.y,
								})}
							/>
						</SectionField>
					</div>

					<SectionField
						label="Rotation"
						beforeLabel={
							<KeyframeToggle
								isActive={rotation.isKeyframedAtTime}
								isDisabled={!isPlayheadWithinElementRange}
								title="Toggle rotation keyframe"
								onToggle={rotation.toggleKeyframe}
							/>
						}
					>
						<div className="flex items-center gap-2">
							<NumberField
								icon={<HugeiconsIcon icon={RotateClockwiseIcon} />}
								className="flex-none"
								value={rotation.displayValue}
								onFocus={rotation.onFocus}
								onChange={rotation.onChange}
								onBlur={rotation.onBlur}
								dragSensitivity="slow"
								onScrub={rotation.scrubTo}
								onScrubEnd={rotation.commitScrub}
								onReset={() =>
									rotation.commitValue({
										value: DEFAULTS.element.transform.rotate,
									})
								}
								isDefault={isPropertyAtDefault({
									hasAnimatedKeyframes: rotation.hasAnimatedKeyframes,
									isPlayheadWithinElementRange,
									resolvedValue: resolvedTransform.rotate,
									staticValue: element.transform.rotate,
									defaultValue: DEFAULTS.element.transform.rotate,
								})}
							/>
						</div>
					</SectionField>

					<SectionField
						label="Opacity"
						beforeLabel={
							<KeyframeToggle
								isActive={opacity.isKeyframedAtTime}
								isDisabled={!isPlayheadWithinElementRange}
								title="Toggle opacity keyframe"
								onToggle={opacity.toggleKeyframe}
							/>
						}
					>
						<NumberField
							icon="%"
							value={opacity.displayValue}
							onFocus={opacity.onFocus}
							onChange={opacity.onChange}
							onBlur={opacity.onBlur}
							dragSensitivity="slow"
							onScrub={opacity.scrubTo}
							onScrubEnd={opacity.commitScrub}
							onReset={() =>
								opacity.commitValue({ value: DEFAULTS.element.opacity })
							}
							isDefault={isPropertyAtDefault({
								hasAnimatedKeyframes: opacity.hasAnimatedKeyframes,
								isPlayheadWithinElementRange,
								resolvedValue: element.opacity,
								staticValue: element.opacity,
								defaultValue: DEFAULTS.element.opacity,
							})}
						/>
					</SectionField>
				</SectionFields>
			</SectionContent>
		</Section>
	);
}
