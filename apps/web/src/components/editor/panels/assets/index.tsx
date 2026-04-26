"use client";

import { Separator } from "@/components/ui/separator";
import { type Tab, useAssetsPanelStore } from "@/stores/assets-panel-store";
import { TabBar } from "./tabbar";
import { AIView } from "./views/ai";
import { MediaView } from "./views/assets";
import { TextView } from "./views/text";
import { EffectsView } from "./views/effects";
import { StickersView } from "./views/stickers";
import { MasksBrowserView } from "./views/masks-browser";
import { Captions } from "./views/captions";
import { SettingsView } from "./views/settings";

export function AssetsPanel() {
	const { activeTab } = useAssetsPanelStore();

	const viewMap: Record<Tab, React.ReactNode> = {
		ai: <AIView />,
		media: <MediaView />,
		text: <TextView />,
		effects: <EffectsView />,
		stickers: <StickersView />,
		masks: <MasksBrowserView />,
		captions: <Captions />,
		settings: <SettingsView />,
	};

	return (
		<div className="panel bg-background flex h-full rounded-sm border overflow-hidden">
			<TabBar />
			<Separator orientation="vertical" />
			<div className="flex-1 overflow-hidden">{viewMap[activeTab]}</div>
		</div>
	);
}
