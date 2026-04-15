"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditor } from "@/hooks/use-editor";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import { usePropertiesStore } from "./stores/properties-store";
import { getPropertiesConfig } from "./registry";
import { cn } from "@/utils/ui";
import { EmptyView } from "./empty-view";
import { ColorTab } from "./tabs/color-tab";
import { ClipEffectsTab, StandaloneEffectTab } from "./tabs/effects-tab";
import { AudioTab } from "./tabs/audio-tab";
import { TransitionsTab } from "./tabs/transitions-tab";
import { MasksTab } from "./tabs/masks-tab";
import { TextTab } from "./tabs/text-tab";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowLeft01Icon,
	Sun03Icon,
	MagicWand05Icon,
	MusicNote03Icon,
	TransitionTopIcon,
	MoreHorizontalCircle01Icon,
	MaskingIcon,
	ClosedCaptionIcon,
	PaintBoardIcon,
} from "@hugeicons/core-free-icons";
import type {
	VideoElement,
	ImageElement,
	AudioElement,
	VisualElement,
	EffectElement,
	TimelineElement,
} from "@/lib/timeline";

type InspectorView = "color" | "effects" | "audio" | "transitions" | "masks" | "captions" | null;

function getInspectorCards(element: TimelineElement): {
	key: InspectorView;
	label: string;
	icon: typeof Sun03Icon;
}[] {
	const cards: { key: InspectorView; label: string; icon: typeof Sun03Icon }[] = [];
	switch (element.type) {
		case "video":
			cards.push(
				{ key: "color", label: "Color Grading", icon: Sun03Icon },
				{ key: "effects", label: "Effects", icon: MagicWand05Icon },
				{ key: "audio", label: "Audio", icon: MusicNote03Icon },
				{ key: "transitions", label: "Transitions", icon: TransitionTopIcon },
				{ key: "masks", label: "Masks", icon: MaskingIcon },
			);
			break;
		case "image":
			cards.push(
				{ key: "color", label: "Color Grading", icon: Sun03Icon },
				{ key: "effects", label: "Effects", icon: MagicWand05Icon },
				{ key: "masks", label: "Masks", icon: MaskingIcon },
			);
			break;
		case "text":
			cards.push(
				{ key: "effects", label: "Effects", icon: MagicWand05Icon },
				{ key: "captions", label: "Caption Style", icon: ClosedCaptionIcon },
			);
			break;
		case "sticker":
		case "graphic":
			cards.push(
				{ key: "effects", label: "Effects", icon: MagicWand05Icon },
				{ key: "masks", label: "Masks", icon: MaskingIcon },
			);
			break;
		case "effect":
			cards.push({ key: "effects", label: "Effects", icon: MagicWand05Icon });
			break;
		case "audio":
			break;
	}
	return cards;
}

function getMoreCards(element: TimelineElement): {
	key: InspectorView;
	label: string;
	icon: typeof Sun03Icon;
}[] {
	const cards: { key: InspectorView; label: string; icon: typeof Sun03Icon }[] = [];
	if (element.type === "video" || element.type === "image" || element.type === "graphic") {
		cards.push(
			{ key: "masks", label: "Masks", icon: MaskingIcon },
		);
	}
	if (element.type === "video" || element.type === "image") {
		cards.push(
			{ key: "color", label: "Color Grading", icon: PaintBoardIcon },
		);
	}
	if (element.type === "text") {
		cards.push(
			{ key: "captions", label: "Caption Style", icon: ClosedCaptionIcon },
		);
	}
	return cards;
}

export function PropertiesPanel() {
	const editor = useEditor();
	useEditor((e) => e.scenes.getActiveSceneOrNull());
	useEditor((e) => e.media.getAssets());
	const { selectedElements } = useElementSelection();
	const { activeTabPerType, setActiveTab } = usePropertiesStore();
	const [inspectorView, setInspectorView] = useState<InspectorView>(null);

	const selectedElementId = selectedElements[0]?.elementId;

	useEffect(() => {
		setInspectorView(null);
	}, [selectedElementId]);

	if (selectedElements.length === 0) {
		return (
			<div className="panel bg-background flex h-full flex-col items-center justify-center overflow-hidden rounded-sm border">
				<EmptyView />
			</div>
		);
	}

	if (selectedElements.length > 1) {
		return (
			<div className="panel bg-background flex h-full flex-col items-center justify-center overflow-hidden rounded-sm border">
				<p className="text-muted-foreground text-sm">
					{selectedElements.length} elements selected.0
				</p>
			</div>
		);
	}

	const mediaAssets = editor.media.getAssets();

	const elementsWithTracks = editor.timeline.getElementsWithTracks({
		elements: selectedElements,
	});
	const elementWithTrack = elementsWithTracks[0];

	if (!elementWithTrack) return null;

	const { element, track } = elementWithTrack;
	const config = getPropertiesConfig({ element, mediaAssets });
	const visibleTabs = config.tabs;

	const storedTabId = activeTabPerType[element.type];
	const isStoredTabVisible = visibleTabs.some((t) => t.id === storedTabId);
	const activeTabId = isStoredTabVisible ? storedTabId : config.defaultTab;
	const activeTab =
		visibleTabs.find((t) => t.id === activeTabId) ?? visibleTabs[0];

	if (!activeTab) return null;

	const cards = getInspectorCards(element);

	const moreCards = getMoreCards(element);

	return (
		<div className="panel bg-background flex h-full overflow-hidden rounded-sm border">
			<TooltipProvider delayDuration={0}>
				<div className="flex shrink-0 flex-col gap-0.5 border-r p-1 scrollbar-hidden overflow-y-auto">
					{visibleTabs.map((tab) => (
						<Tooltip key={tab.id}>
							<TooltipTrigger asChild>
								<Button
									variant={tab.id === activeTab.id && inspectorView === null ? "secondary" : "ghost"}
									size="icon"
									onClick={() => {
										setActiveTab(element.type, tab.id);
										setInspectorView(null);
									}}
									aria-label={tab.label}
									className={cn(
										"shrink-0",
										"h-8 w-8",
										tab.id !== activeTab.id && "text-muted-foreground",
									)}
								>
									{tab.icon}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right">{tab.label}</TooltipContent>
						</Tooltip>
					))}
					{moreCards.length > 0 && (
						<>
							<div className="bg-border mx-1 my-1 h-px" />
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant={inspectorView !== null && cards.every(c => c.key !== inspectorView) ? "secondary" : "ghost"}
										size="icon"
										onClick={() => {
											if (inspectorView === "masks" || inspectorView === "captions") return;
											setInspectorView(moreCards[0].key);
										}}
										aria-label="More"
										className="shrink-0 h-8 w-8 text-muted-foreground"
									>
										<HugeiconsIcon icon={MoreHorizontalCircle01Icon} size={16} />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="right">More</TooltipContent>
							</Tooltip>
						</>
					)}
				</div>
			</TooltipProvider>
			<ScrollArea className="flex-1 scrollbar-hidden">
				{inspectorView === null ? (
					<>
						{activeTab.content({ trackId: track.id })}
						{cards.length > 0 && (
							<div className="flex flex-col gap-2 p-2">
								{cards.map((card) => (
									<button
										key={card.key}
										type="button"
										onClick={() => setInspectorView(card.key)}
										className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors"
									>
										<HugeiconsIcon icon={card.icon} size={16} className="text-muted-foreground" />
										{card.label}
									</button>
								))}
							</div>
						)}
					</>
				) : (
					<>
						<div className="border-b px-3.5 h-11 shrink-0 flex items-center">
							<button
								type="button"
								onClick={() => setInspectorView(null)}
								className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								<HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
								Back
							</button>
						</div>
						{inspectorView === "color" &&
							(element.type === "video" || element.type === "image") && (
								<ColorTab
									element={element as VideoElement | ImageElement}
									trackId={track.id}
								/>
							)}
						{inspectorView === "effects" &&
							element.type === "effect" && (
								<StandaloneEffectTab
									element={element as EffectElement}
									trackId={track.id}
								/>
							)}
						{inspectorView === "effects" &&
							element.type !== "effect" && (
								<ClipEffectsTab
									element={element as VisualElement}
									trackId={track.id}
								/>
							)}
						{inspectorView === "audio" &&
							(element.type === "video" || element.type === "audio") && (
								<AudioTab
									element={element as AudioElement | VideoElement}
									trackId={track.id}
								/>
							)}
						{inspectorView === "transitions" &&
							element.type === "video" && (
								<TransitionsTab
									element={element as VideoElement}
									trackId={track.id}
								/>
							)}
						{inspectorView === "masks" &&
							(element.type === "video" || element.type === "image" || element.type === "graphic") && (
								<MasksTab
									element={element as import("@/lib/timeline").MaskableElement}
									trackId={track.id}
								/>
							)}
						{inspectorView === "captions" &&
							element.type === "text" && (
								<TextTab
									element={element as import("@/lib/timeline").TextElement}
									trackId={track.id}
								/>
							)}
					</>
				)}
			</ScrollArea>
		</div>
	);
}
