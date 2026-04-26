"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/hooks/use-editor";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import { usePropertiesStore } from "./stores/properties-store";
import { getPropertiesConfig } from "./registry";
import { cn } from "@/utils/ui";
import { EmptyView } from "./empty-view";

const TYPE_LABELS: Record<string, string> = {
	video: "Video",
	audio: "Audio",
	text: "Text",
	graphic: "Graphic",
	sticker: "Sticker",
	effect: "Effect",
	mask: "Mask",
	image: "Image",
};

export function PropertiesPanel() {
	const editor = useEditor();
	useEditor((e) => e.scenes.getActiveSceneOrNull());
	useEditor((e) => e.media.getAssets());
	const { selectedElements } = useElementSelection();
	const { activeTabPerType, setActiveTab } = usePropertiesStore();

	if (selectedElements.length === 0) {
		return (
			<div className="panel bg-background flex h-full flex-col items-center justify-center overflow-hidden rounded-sm border">
				<EmptyView />
			</div>
		);
	}

	if (selectedElements.length > 1) {
		const elementsWithTracks = editor.timeline.getElementsWithTracks({
			elements: selectedElements,
		});

		const types = new Set(elementsWithTracks.map((e) => e.element.type));

		if (types.size === 1) {
			const firstResult = elementsWithTracks[0];
			if (!firstResult) return null;

			const config = getPropertiesConfig({
				element: firstResult.element,
				mediaAssets: editor.media.getAssets(),
			});

			const storedTabId = activeTabPerType[firstResult.element.type];
			const isStoredTabVisible = config.tabs.some((t) => t.id === storedTabId);
			const activeTabId = isStoredTabVisible ? storedTabId : config.defaultTab;
			const activeTab =
				config.tabs.find((t) => t.id === activeTabId) ?? config.tabs[0];
			if (!activeTab) return null;

			return (
				<div className="panel bg-background flex h-full overflow-hidden rounded-sm border">
					<TooltipProvider delayDuration={0}>
						<div className="flex shrink-0 flex-col gap-0.5 border-r p-1 scrollbar-hidden overflow-y-auto">
							{config.tabs.map((tab) => (
								<Tooltip key={tab.id}>
									<TooltipTrigger asChild>
										<Button
											variant={tab.id === activeTab.id ? "secondary" : "ghost"}
											size="icon"
											onClick={() =>
												setActiveTab(firstResult.element.type, tab.id)
											}
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
						</div>
					</TooltipProvider>
					<ScrollArea className="flex-1 scrollbar-hidden">
						<div className="p-4">
							<p className="text-muted-foreground text-xs mb-3">
								{elementsWithTracks.length} {firstResult.element.type} elements
								selected
							</p>
						</div>
						{activeTab.content({ trackId: firstResult.track.id })}
					</ScrollArea>
				</div>
			);
		}

		return (
			<div className="panel bg-background flex h-full overflow-hidden rounded-sm border">
				<ScrollArea className="flex-1 scrollbar-hidden">
					<div className="flex h-full items-center justify-center p-8">
						<div className="w-full max-w-sm space-y-4">
							<div className="text-center space-y-2">
								<p className="text-muted-foreground text-sm font-medium">
									{elementsWithTracks.length} elements selected
								</p>
								<p className="text-muted-foreground/60 text-xs">
									Mixed selection
								</p>
							</div>
							<div className="grid grid-cols-2 gap-2">
								{[...types].map((type) => {
									const count = elementsWithTracks.filter(
										(entry) => entry.element.type === type,
									).length;
									return (
										<div
											key={type}
											className="rounded-lg border bg-muted/40 px-3 py-3"
										>
											<div className="text-foreground text-sm font-medium">
												{TYPE_LABELS[type] ?? type}
											</div>
											<div className="text-muted-foreground mt-1 text-xs">
												{count} selected
											</div>
										</div>
									);
								})}
							</div>
							<p className="text-muted-foreground/60 text-center text-xs">
								Shared single-type controls are unavailable until the selection
								is narrowed.
							</p>
						</div>
					</div>
				</ScrollArea>
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

	return (
		<div className="panel bg-background flex h-full overflow-hidden rounded-sm border">
			<TooltipProvider delayDuration={0}>
				<div className="flex shrink-0 flex-col gap-0.5 border-r p-1 scrollbar-hidden overflow-y-auto">
					{visibleTabs.map((tab) => (
						<Tooltip key={tab.id}>
							<TooltipTrigger asChild>
								<Button
									variant={tab.id === activeTab.id ? "secondary" : "ghost"}
									size="icon"
									onClick={() => setActiveTab(element.type, tab.id)}
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
				</div>
			</TooltipProvider>
			<ScrollArea className="flex-1 scrollbar-hidden">
				{activeTab.content({ trackId: track.id })}
			</ScrollArea>
		</div>
	);
}
