"use client";

import type { MaskOverlayElement, MaskableElement } from "@/lib/timeline";
import type { Mask, MaskType } from "@/lib/masks/types";
import type {
	NumberParamDefinition,
	SelectParamDefinition,
} from "@/lib/params";
import { masksRegistry, buildDefaultMaskInstance } from "@/lib/masks";
import {
	appendMask,
	duplicateMask,
	getNextActiveMaskId,
	resolveActiveMaskId,
	reorderMasks,
} from "@/lib/masks/active-mask";
import { useEditor } from "@/hooks/use-editor";
import { useElementPreview } from "@/hooks/use-element-preview";
import { useMenuPreview } from "@/hooks/use-menu-preview";
import { getVisibleElementsWithBounds } from "@/lib/preview/element-bounds";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Delete02Icon,
	FeatherIcon,
	PlusSignIcon,
	RotateClockwiseIcon,
	ViewIcon,
	ViewOffSlashIcon,
	Copy01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NumberField } from "@/components/ui/number-field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	clamp,
	formatNumberForDisplay,
	getFractionDigitsForStep,
	snapToStep,
} from "@/utils/math";
import { SectionField, SectionFields } from "@/components/section";
import { usePropertyDraft } from "../hooks/use-property-draft";
import { OcMirrorIcon, OcShapesIcon } from "@/components/icons";
import { cn } from "@/utils/ui";
import { usePropertiesStore } from "../stores/properties-store";
import { generateUUID } from "@/utils/id";
import { isMaskVisible } from "@/lib/masks/browser-and-visibility";
import { getMaskDisplayName } from "@/lib/masks/naming";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";

type MasksTabProps = {
	element: MaskableElement | MaskOverlayElement;
	trackId: string;
};

type RegisteredMaskDefinition = ReturnType<(typeof masksRegistry)["get"]>;

export function MasksTab({ element, trackId }: MasksTabProps) {
	const editor = useEditor();
	const activeMaskKey = `${trackId}:${element.id}`;
	const activeMaskId = usePropertiesStore(
		(state) => state.activeMaskByElement[activeMaskKey] ?? null,
	);
	const setActiveMask = usePropertiesStore((state) => state.setActiveMask);
	const clearActiveMask = usePropertiesStore((state) => state.clearActiveMask);
	const { renderElement, previewUpdates, commit } = useElementPreview<
		MaskableElement | MaskOverlayElement
	>({
		trackId,
		elementId: element.id,
		fallback: element,
	});
	const maskDefs = masksRegistry.getAll();
	const tracks = useEditor(
		(e) => e.timeline.getPreviewTracks() ?? e.scenes.getActiveScene().tracks,
	);
	const currentTime = useEditor((e) => e.playback.getCurrentTime());
	const mediaAssets = useEditor((e) => e.media.getAssets());
	const canvasSize = useEditor(
		(e) => e.project.getActive().settings.canvasSize,
	);
	const masks = element.masks ?? [];
	const renderMasks = renderElement.masks ?? masks;
	const resolvedActiveMaskId = resolveActiveMaskId({
		masks: renderMasks,
		activeMaskId,
	});
	const { onPointerLeave, onOpenChange, markCommitted } = useMenuPreview();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [expandedMaskId, setExpandedMaskId] = useState<string | null>(null);
	const elementBounds = useMemo(() => {
		const clampedTime = Math.min(
			Math.max(currentTime, element.startTime),
			element.startTime + element.duration - 1,
		);

		return (
			getVisibleElementsWithBounds({
				tracks,
				currentTime: clampedTime,
				canvasSize,
				mediaAssets,
			}).find(
				(item) => item.trackId === trackId && item.elementId === element.id,
			)?.bounds ?? null
		);
	}, [
		canvasSize,
		currentTime,
		element.duration,
		element.id,
		element.startTime,
		mediaAssets,
		trackId,
		tracks,
	]);

	useEffect(() => {
		if (resolvedActiveMaskId !== activeMaskId) {
			if (resolvedActiveMaskId) {
				setActiveMask({
					trackId,
					elementId: element.id,
					maskId: resolvedActiveMaskId,
				});
			} else {
				clearActiveMask({ trackId, elementId: element.id });
			}
		}
	}, [
		activeMaskId,
		clearActiveMask,
		element.id,
		resolvedActiveMaskId,
		setActiveMask,
		trackId,
	]);

	const handleDropdownOpenChange = (open: boolean) => {
		setIsDropdownOpen(open);
		onOpenChange(open);
	};

	const previewMask = ({ maskType }: { maskType: MaskType }) => {
		const nextMask = buildDefaultMaskInstance({
			maskType,
			elementSize: elementBounds
				? {
						width: elementBounds.width,
						height: elementBounds.height,
					}
				: undefined,
		});
		const appended = appendMask({ masks: renderMasks, mask: nextMask });
		setActiveMask({
			trackId,
			elementId: element.id,
			maskId: appended.activeMaskId,
		});
		editor.timeline.previewElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: {
						masks: appended.masks,
					} as Partial<typeof renderElement>,
				},
			],
		});
	};

	const commitMask = ({ maskType }: { maskType: MaskType }) => {
		const nextMask = buildDefaultMaskInstance({
			maskType,
			elementSize: elementBounds
				? {
						width: elementBounds.width,
						height: elementBounds.height,
					}
				: undefined,
		});
		const appended = appendMask({ masks, mask: nextMask });
		setActiveMask({
			trackId,
			elementId: element.id,
			maskId: appended.activeMaskId,
		});
		setExpandedMaskId(appended.activeMaskId);
		if (editor.timeline.isPreviewActive()) {
			editor.timeline.commitPreview();
		} else {
			editor.timeline.updateElements({
				updates: [
					{
						trackId,
						elementId: element.id,
						patch: {
							masks: appended.masks,
						} as Partial<typeof element>,
					},
				],
			});
		}
		markCommitted();
		setIsDropdownOpen(false);
	};

	const previewMaskParam =
		({ maskId, key }: { maskId: string; key: string }) =>
		(value: number | string | boolean) => {
			if (!renderMasks.some((mask) => mask.id === maskId)) {
				return;
			}

			const updatedMasks = renderMasks.map((existingMask) =>
				existingMask.id !== maskId
					? existingMask
					: {
							...existingMask,
							params: {
								...existingMask.params,
								[key]: value,
							},
						},
			);

			previewUpdates({ masks: updatedMasks } as Partial<typeof renderElement>);
		};

	const moveMask = ({
		fromIndex,
		toIndex,
	}: {
		fromIndex: number;
		toIndex: number;
	}) => {
		const reordered = reorderMasks({
			masks,
			fromIndex,
			toIndex,
			activeMaskId: resolvedActiveMaskId,
		});
		if (!reordered) return;

		setActiveMask({
			trackId,
			elementId: element.id,
			maskId: reordered.activeMaskId,
		});
		editor.timeline.reorderMask({
			trackId,
			elementId: element.id,
			fromIndex,
			toIndex,
		});
	};

	const toggleExpand = (maskId: string) => {
		setExpandedMaskId((prev) => (prev === maskId ? null : maskId));
		setActiveMask({
			trackId,
			elementId: element.id,
			maskId,
		});
	};

	const deleteMask = (maskId: string) => {
		const nextActive = getNextActiveMaskId({
			masks,
			activeMaskId: maskId,
			removedMaskId: maskId,
		});
		if (nextActive) {
			setActiveMask({
				trackId,
				elementId: element.id,
				maskId: nextActive,
			});
		} else {
			clearActiveMask({ trackId, elementId: element.id });
		}
		if (expandedMaskId === maskId) {
			setExpandedMaskId(nextActive ?? null);
		}
		editor.timeline.removeMask({
			trackId,
			elementId: element.id,
			maskId,
		});
	};

	const duplicateMaskAction = (maskId: string) => {
		const duplicated = duplicateMask({
			masks,
			maskId,
			duplicateId: generateUUID(),
		});
		if (!duplicated) return;
		setActiveMask({
			trackId,
			elementId: element.id,
			maskId: duplicated.activeMaskId,
		});
		setExpandedMaskId(duplicated.activeMaskId);
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					patch: {
						masks: duplicated.masks,
					} as Partial<typeof element>,
				},
			],
		});
	};

	return (
		<div className="flex flex-col h-full">
			<div className="border-b px-3.5 h-11 shrink-0 flex items-center justify-between gap-2">
				<span className="text-sm font-medium">Masks</span>
				<DropdownMenu
					open={isDropdownOpen}
					onOpenChange={handleDropdownOpenChange}
				>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" aria-label="Add mask">
							<HugeiconsIcon icon={PlusSignIcon} className="size-3.5!" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-40" onPointerLeave={onPointerLeave}>
						{maskDefs.map((definition) => (
							<DropdownMenuItem
								key={definition.type}
								onPointerEnter={() =>
									previewMask({ maskType: definition.type })
								}
								onClick={() => commitMask({ maskType: definition.type })}
							>
								<HugeiconsIcon {...definition.icon} />
								{definition.name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{masks.length === 0 ? (
				<EmptyView onAddMask={() => setIsDropdownOpen(true)} />
			) : (
				<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
					<div className="flex flex-col gap-1 p-2">
						{renderMasks.map((mask, index) => {
							const definition = masksRegistry.get(mask.type);
							const isExpanded = expandedMaskId === mask.id;
							const isActive = mask.id === resolvedActiveMaskId;

							return (
								<div
									key={mask.id}
									className={cn(
										"overflow-hidden rounded-md border",
										isActive
											? "border-primary/30 bg-primary/5"
											: "border-border",
									)}
								>
									<button
										type="button"
										className={cn(
											"flex w-full items-center gap-1.5 px-2 py-2 text-left transition-colors",
											isActive ? "bg-primary/10" : "hover:bg-muted/50",
										)}
										onClick={() => toggleExpand(mask.id)}
									>
										<HugeiconsIcon
											{...definition.icon}
											size={14}
											className={cn(
												"shrink-0",
												isActive ? "text-primary" : "text-muted-foreground",
											)}
										/>
										<span
											className={cn(
												"flex-1 truncate text-sm",
												!isMaskVisible(mask) &&
													"text-muted-foreground line-through",
											)}
										>
											{getMaskDisplayName({
												mask,
												fallbackName: definition.name,
												index,
											})}
										</span>
										<ChevronDown
											className={cn(
												"size-3.5 text-muted-foreground shrink-0 transition-transform",
												isExpanded && "rotate-180",
											)}
										/>
									</button>

									{isExpanded && (
										<ExpandedMaskView
											mask={mask}
											definition={definition}
											isActive={isActive}
											trackId={trackId}
											elementId={element.id}
											allMasks={masks}
											expandedMaskId={expandedMaskId}
											onToggleVisibility={() =>
												editor.timeline.toggleMaskVisibility({
													trackId,
													elementId: element.id,
													maskId: mask.id,
												})
											}
											onToggleInverted={() =>
												editor.timeline.toggleMaskInverted({
													trackId,
													elementId: element.id,
													maskId: mask.id,
												})
											}
											onDuplicate={() => duplicateMaskAction(mask.id)}
											onDelete={() => deleteMask(mask.id)}
											onRename={(name) =>
												editor.timeline.renameMask({
													trackId,
													elementId: element.id,
													maskId: mask.id,
													name,
												})
											}
											onMoveUp={
												index > 0
													? () =>
															moveMask({
																fromIndex: index,
																toIndex: index - 1,
															})
													: undefined
											}
											onMoveDown={
												index < renderMasks.length - 1
													? () =>
															moveMask({
																fromIndex: index,
																toIndex: index + 1,
															})
													: undefined
											}
											getPreviewParam={(key) =>
												previewMaskParam({ maskId: mask.id, key })
											}
											onCommit={commit}
										/>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

function ExpandedMaskView({
	mask,
	definition,
	onToggleVisibility,
	onToggleInverted,
	onDuplicate,
	onDelete,
	onMoveUp,
	onMoveDown,
	onRename,
	getPreviewParam,
	onCommit,
}: {
	mask: Mask;
	definition: RegisteredMaskDefinition;
	isActive: boolean;
	trackId: string;
	elementId: string;
	allMasks: Mask[];
	expandedMaskId: string | null;
	onToggleVisibility: () => void;
	onToggleInverted: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	onRename: (name: string) => void;
	getPreviewParam: (key: string) => (value: number | string | boolean) => void;
	onCommit: () => void;
}) {
	const [isRenaming, setIsRenaming] = useState(false);
	const displayName = getMaskDisplayName({
		mask,
		fallbackName: definition.name,
		index: 0,
	});

	return (
		<div className="border-t bg-background/70 px-2 py-2">
			<div className="mb-2 flex items-center gap-0.5">
				{isRenaming ? (
					<Input
						size="sm"
						defaultValue={displayName}
						onBlur={(e) => {
							onRename(e.currentTarget.value);
							setIsRenaming(false);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								onRename(e.currentTarget.value);
								setIsRenaming(false);
							} else if (e.key === "Escape") {
								setIsRenaming(false);
							}
						}}
						className="h-6 text-xs flex-1"
						autoFocus
					/>
				) : (
					<button
						type="button"
						className="flex-1 text-xs text-muted-foreground hover:text-foreground text-left px-1 truncate"
						onDoubleClick={() => setIsRenaming(true)}
					>
						{displayName}
					</button>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="size-6"
					aria-label={isMaskVisible(mask) ? "Hide" : "Show"}
					onClick={(e) => {
						e.stopPropagation();
						onToggleVisibility();
					}}
				>
					<HugeiconsIcon
						icon={isMaskVisible(mask) ? ViewIcon : ViewOffSlashIcon}
						size={12}
					/>
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="size-6"
					aria-label="Invert"
					onClick={(e) => {
						e.stopPropagation();
						onToggleInverted();
					}}
				>
					<OcMirrorIcon
						className={cn("size-3", mask.params.inverted && "-scale-x-100")}
					/>
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="size-6"
					aria-label="Duplicate"
					onClick={(e) => {
						e.stopPropagation();
						onDuplicate();
					}}
				>
					<HugeiconsIcon icon={Copy01Icon} size={12} />
				</Button>
				{onMoveUp && (
					<Button
						variant="ghost"
						size="icon"
						className="size-6"
						aria-label="Move up"
						onClick={(e) => {
							e.stopPropagation();
							onMoveUp();
						}}
					>
						<ChevronUp className="size-3" />
					</Button>
				)}
				{onMoveDown && (
					<Button
						variant="ghost"
						size="icon"
						className="size-6"
						aria-label="Move down"
						onClick={(e) => {
							e.stopPropagation();
							onMoveDown();
						}}
					>
						<ChevronDown className="size-3" />
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="size-6 text-destructive/70 hover:text-destructive"
					aria-label="Delete"
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
				>
					<HugeiconsIcon icon={Delete02Icon} size={12} />
				</Button>
			</div>

			<MaskParamsFields
				mask={mask}
				definition={definition}
				previewParam={getPreviewParam}
				onCommit={onCommit}
			/>
		</div>
	);
}

function MaskParamsFields({
	mask,
	definition,
	previewParam,
	onCommit,
}: {
	mask: Mask;
	definition: RegisteredMaskDefinition;
	previewParam: (key: string) => (value: number | string | boolean) => void;
	onCommit: () => void;
}) {
	const featherParam = getNumberParamDefinition({
		definition,
		key: "feather",
	});
	const strokeWidthParam = getNumberParamDefinition({
		definition,
		key: "strokeWidth",
	});
	const previewNumberParam = (key: string) => (value: number) =>
		previewParam(key)(value);
	const previewStrokeColor = previewParam("strokeColor");
	const strokeAlignParam = definition.params.find(
		(param): param is SelectParamDefinition =>
			param.key === "strokeAlign" && param.type === "select",
	);

	return (
		<SectionFields>
			{definition.features.hasPosition &&
				"centerX" in mask.params &&
				"centerY" in mask.params && (
					<SectionField label="Position">
						<div className="flex items-center gap-2">
							<MaskNumberField
								className="flex-1"
								icon="X"
								param={getNumberParamDefinition({
									definition,
									key: "centerX",
								})}
								value={getMaskNumber({
									params: mask.params,
									key: "centerX",
								})}
								onPreview={previewNumberParam("centerX")}
								onCommit={onCommit}
							/>
							<MaskNumberField
								className="flex-1"
								icon="Y"
								param={getNumberParamDefinition({
									definition,
									key: "centerY",
								})}
								value={getMaskNumber({
									params: mask.params,
									key: "centerY",
								})}
								onPreview={previewNumberParam("centerY")}
								onCommit={onCommit}
							/>
						</div>
					</SectionField>
				)}

			{definition.features.sizeMode === "width-height" &&
				"width" in mask.params &&
				"height" in mask.params && (
					<SectionField label="Size">
						<div className="flex items-center gap-2">
							<MaskNumberField
								className="flex-1"
								icon="W"
								param={getNumberParamDefinition({
									definition,
									key: "width",
								})}
								value={getMaskNumber({
									params: mask.params,
									key: "width",
								})}
								onPreview={previewNumberParam("width")}
								onCommit={onCommit}
							/>
							<MaskNumberField
								className="flex-1"
								icon="H"
								param={getNumberParamDefinition({
									definition,
									key: "height",
								})}
								value={getMaskNumber({
									params: mask.params,
									key: "height",
								})}
								onPreview={previewNumberParam("height")}
								onCommit={onCommit}
							/>
						</div>
					</SectionField>
				)}

			{definition.features.sizeMode === "height-only" &&
				"height" in mask.params && (
					<SectionField label="Height">
						<MaskNumberField
							icon="H"
							param={getNumberParamDefinition({
								definition,
								key: "height",
							})}
							value={getMaskNumber({
								params: mask.params,
								key: "height",
							})}
							onPreview={previewNumberParam("height")}
							onCommit={onCommit}
						/>
					</SectionField>
				)}

			{definition.features.sizeMode === "width-only" &&
				"width" in mask.params && (
					<SectionField label="Width">
						<MaskNumberField
							icon="W"
							param={getNumberParamDefinition({
								definition,
								key: "width",
							})}
							value={getMaskNumber({
								params: mask.params,
								key: "width",
							})}
							onPreview={previewNumberParam("width")}
							onCommit={onCommit}
						/>
					</SectionField>
				)}

			{definition.features.sizeMode === "uniform" && "scale" in mask.params && (
				<SectionField label="Scale">
					<MaskNumberField
						icon="S"
						param={getNumberParamDefinition({
							definition,
							key: "scale",
						})}
						value={getMaskNumber({
							params: mask.params,
							key: "scale",
						})}
						onPreview={previewNumberParam("scale")}
						onCommit={onCommit}
					/>
				</SectionField>
			)}

			{definition.features.hasRotation && "rotation" in mask.params && (
				<SectionField label="Rotation">
					<MaskNumberField
						icon={<HugeiconsIcon icon={RotateClockwiseIcon} />}
						param={getNumberParamDefinition({
							definition,
							key: "rotation",
						})}
						value={getMaskNumber({
							params: mask.params,
							key: "rotation",
						})}
						onPreview={previewNumberParam("rotation")}
						onCommit={onCommit}
					/>
				</SectionField>
			)}

			<SectionField label="Feather">
				<MaskNumberField
					icon={<HugeiconsIcon icon={FeatherIcon} />}
					param={featherParam}
					value={getMaskNumber({
						params: mask.params,
						key: "feather",
					})}
					onPreview={previewNumberParam("feather")}
					onCommit={onCommit}
				/>
			</SectionField>

			<SectionField label="Fill">
				<div className="flex items-center gap-2">
					<MaskNumberField
						className="flex-1"
						icon="O"
						param={{
							key: "fillOpacity",
							label: "Fill Opacity",
							type: "number",
							default: 0,
							min: 0,
							max: 100,
							step: 1,
						}}
						value={
							((mask.params as Record<string, unknown>)
								.fillOpacity as number) ?? 0
						}
						onPreview={previewNumberParam("fillOpacity")}
						onCommit={onCommit}
					/>
					<ColorPicker
						value={(
							((mask.params as Record<string, unknown>).fillColor as string) ??
							"#000000"
						).replace(/^#/, "")}
						onChange={(color) => previewParam("fillColor")(`#${color}`)}
						onChangeEnd={(color) => {
							previewParam("fillColor")(`#${color}`);
							onCommit();
						}}
					/>
				</div>
			</SectionField>

			<SectionField label="Stroke">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<MaskNumberField
							className="flex-1"
							icon="W"
							param={strokeWidthParam}
							value={getMaskNumber({
								params: mask.params,
								key: "strokeWidth",
							})}
							onPreview={previewNumberParam("strokeWidth")}
							onCommit={onCommit}
						/>
						<ColorPicker
							value={mask.params.strokeColor.replace(/^#/, "").toUpperCase()}
							onChange={(color) => previewStrokeColor(`#${color}`)}
							onChangeEnd={(color) => {
								previewStrokeColor(`#${color}`);
								onCommit();
							}}
						/>
					</div>
					{strokeAlignParam ? (
						<Select
							value={mask.params.strokeAlign}
							onValueChange={(value) => {
								previewParam("strokeAlign")(value);
								onCommit();
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{strokeAlignParam.options.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : null}
				</div>
			</SectionField>
		</SectionFields>
	);
}

function getNumberParamDefinition({
	definition,
	key,
}: {
	definition: RegisteredMaskDefinition;
	key: string;
}): NumberParamDefinition {
	const param = definition.params.find((candidate) => candidate.key === key);

	if (!param || param.type !== "number") {
		throw new Error(`Missing number param definition for mask key "${key}"`);
	}

	return param;
}

function getMaskNumber({
	params,
	key,
}: {
	params: Mask["params"];
	key: string;
}): number {
	const value = params[key];

	if (typeof value !== "number") {
		throw new Error(`Expected numeric mask param for "${key}"`);
	}

	return value;
}

function MaskNumberField({
	param,
	value,
	onPreview,
	onCommit,
	icon,
	className,
}: {
	param: NumberParamDefinition;
	value: number;
	onPreview: (value: number) => void;
	onCommit: () => void;
	icon?: React.ReactNode;
	className?: string;
}) {
	const isPercent = param.unit === "percent";
	const percentMax = param.max ?? 100;
	const displayMultiplier = isPercent
		? 100 / percentMax
		: (param.displayMultiplier ?? 1);
	const min = isPercent ? 0 : param.min;
	const max = isPercent ? 100 : param.max;
	const step = isPercent ? 1 : param.step;
	const displayValue = value * displayMultiplier;
	const maxFractionDigits = getFractionDigitsForStep({ step });

	const clampDisplay = (nextDisplayValue: number) =>
		max !== undefined
			? clamp({ value: nextDisplayValue, min, max })
			: Math.max(min, nextDisplayValue);

	const previewFromDisplay = (nextDisplayValue: number) => {
		onPreview(
			clampDisplay(snapToStep({ value: nextDisplayValue, step })) /
				displayMultiplier,
		);
	};

	const draft = usePropertyDraft({
		displayValue: formatNumberForDisplay({
			value: displayValue,
			maxFractionDigits,
		}),
		parse: (input) => {
			const parsed = parseFloat(input);
			if (Number.isNaN(parsed)) return null;
			return (
				clampDisplay(snapToStep({ value: parsed, step })) / displayMultiplier
			);
		},
		onPreview,
		onCommit,
	});

	return (
		<NumberField
			className={className}
			icon={icon}
			value={draft.displayValue}
			dragSensitivity="slow"
			onFocus={draft.onFocus}
			onChange={draft.onChange}
			onBlur={draft.onBlur}
			onScrub={previewFromDisplay}
			onScrubEnd={onCommit}
		/>
	);
}

function EmptyView({ onAddMask }: { onAddMask: () => void }) {
	return (
		<div className="flex flex-col h-full items-center justify-center gap-4 text-center">
			<OcShapesIcon className="size-10 text-muted-foreground" strokeWidth={1} />
			<div className="flex flex-col gap-2">
				<h3 className="font-medium text-foreground">No masks</h3>
				<p className="text-muted-foreground text-sm text-balance max-w-40">
					Add a mask to hide or reveal parts of this layer.
				</p>
			</div>
			<Button variant="default" size="sm" onClick={onAddMask}>
				Add mask
			</Button>
		</div>
	);
}
