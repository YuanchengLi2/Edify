import type { ReactNode } from "react";
import type {
	EffectElement,
	GraphicElement,
	ImageElement,
	RetimableElement,
	StickerElement,
	TextElement,
	VisualElement,
	VideoElement,
	AudioElement,
	TimelineElement,
	MaskableElement,
	MaskOverlayElement,
} from "@/lib/timeline";
import type { MediaAsset } from "@/lib/media/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	TextFontIcon,
	ArrowExpandIcon,
	KeyframeIcon,
	MusicNote03Icon,
	MagicWand05Icon,
	DashboardSpeed02Icon,
	Sun03Icon,
} from "@hugeicons/core-free-icons";
import { TransformTab } from "./tabs/transform-tab";
import { AudioTab } from "./tabs/audio-tab";
import { TextTab } from "./tabs/text-tab";
import { ClipEffectsTab, StandaloneEffectTab } from "./tabs/effects-tab";
import { SpeedTab } from "./tabs/speed-tab";
import { GraphicTab } from "./tabs/graphic-tab";
import { ColorTab } from "./tabs/color-tab";
import { TransitionsTab } from "./tabs/transitions-tab";
import { KeyframesTab } from "./tabs/keyframes-tab";
import { MasksTab } from "./tabs/masks-tab";
import { OcShapesIcon } from "@/components/icons";
import { TransitionTopIcon } from "@hugeicons/core-free-icons";

export type TabContentProps = {
	trackId: string;
};

export type PropertiesTabDef = {
	id: string;
	label: string;
	icon: ReactNode;
	content: (props: TabContentProps) => ReactNode;
};

export type ElementPropertiesConfig = {
	defaultTab: string;
	tabs: PropertiesTabDef[];
};

function buildTransformTab({
	element,
}: {
	element: VisualElement;
}): PropertiesTabDef {
	return {
		id: "transform",
		label: "Transform",
		icon: <HugeiconsIcon icon={ArrowExpandIcon} size={16} />,
		content: ({ trackId }) => (
			<TransformTab element={element} trackId={trackId} />
		),
	};
}

function buildAudioTab({
	element,
}: {
	element: AudioElement | VideoElement;
}): PropertiesTabDef {
	return {
		id: "audio",
		label: "Audio",
		icon: <HugeiconsIcon icon={MusicNote03Icon} size={16} />,
		content: ({ trackId }) => <AudioTab element={element} trackId={trackId} />,
	};
}

function buildSpeedTab({
	element,
}: {
	element: RetimableElement;
}): PropertiesTabDef {
	return {
		id: "speed",
		label: "Speed",
		icon: <HugeiconsIcon icon={DashboardSpeed02Icon} size={16} />,
		content: ({ trackId }) => <SpeedTab element={element} trackId={trackId} />,
	};
}

function _buildClipEffectsTab({
	element,
}: {
	element: VisualElement;
}): PropertiesTabDef {
	return {
		id: "effects",
		label: "Effects",
		icon: <HugeiconsIcon icon={MagicWand05Icon} size={16} />,
		content: ({ trackId }) => (
			<ClipEffectsTab element={element} trackId={trackId} />
		),
	};
}

function buildTextTab({ element }: { element: TextElement }): PropertiesTabDef {
	return {
		id: "text",
		label: "Text",
		icon: <HugeiconsIcon icon={TextFontIcon} size={16} />,
		content: ({ trackId }) => <TextTab element={element} trackId={trackId} />,
	};
}

function buildGraphicTab({
	element,
}: {
	element: GraphicElement;
}): PropertiesTabDef {
	return {
		id: "graphic",
		label: "Graphic",
		icon: <OcShapesIcon size={16} />,
		content: ({ trackId }) => (
			<GraphicTab element={element} trackId={trackId} />
		),
	};
}

function buildStandaloneEffectTab({
	element,
}: {
	element: EffectElement;
}): PropertiesTabDef {
	return {
		id: "effects",
		label: "Effects",
		icon: <HugeiconsIcon icon={MagicWand05Icon} size={16} />,
		content: ({ trackId }) => (
			<StandaloneEffectTab element={element} trackId={trackId} />
		),
	};
}

function buildColorTab({
	element,
}: {
	element: VideoElement | ImageElement;
}): PropertiesTabDef {
	return {
		id: "color",
		label: "Color",
		icon: <HugeiconsIcon icon={Sun03Icon} size={16} />,
		content: ({ trackId }) => <ColorTab element={element} trackId={trackId} />,
	};
}

function buildKeyframesTab(): PropertiesTabDef {
	return {
		id: "keyframes",
		label: "Keyframes",
		icon: <HugeiconsIcon icon={KeyframeIcon} size={16} />,
		content: () => <KeyframesTab />,
	};
}

function buildTransitionsTab({
	element,
}: {
	element: VideoElement;
}): PropertiesTabDef {
	return {
		id: "transitions",
		label: "Transitions",
		icon: <HugeiconsIcon icon={TransitionTopIcon} size={16} />,
		content: ({ trackId }) => (
			<TransitionsTab element={element} trackId={trackId} />
		),
	};
}

function buildMasksTab({
	element,
}: {
	element: MaskableElement;
}): PropertiesTabDef {
	return {
		id: "masks",
		label: "Masks",
		icon: <OcShapesIcon size={16} />,
		content: ({ trackId }) => <MasksTab element={element} trackId={trackId} />,
	};
}

function getMaskOverlayConfig({
	element,
}: {
	element: MaskOverlayElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "masks",
		tabs: [buildMasksTab({ element })],
	};
}

function getTextConfig({
	element,
}: {
	element: TextElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "text",
		tabs: [
			buildTextTab({ element }),
			buildTransformTab({ element }),
			buildKeyframesTab(),
		],
	};
}

function getVideoConfig({
	element,
	mediaAsset,
}: {
	element: VideoElement;
	mediaAsset: MediaAsset | undefined;
}): ElementPropertiesConfig {
	const showAudioTab = mediaAsset?.hasAudio !== false;
	return {
		defaultTab: "transform",
		tabs: [
			buildTransformTab({ element }),
			...(showAudioTab ? [buildAudioTab({ element })] : []),
			buildSpeedTab({ element }),
			buildKeyframesTab(),
			buildTransitionsTab({ element }),
			buildColorTab({ element }),
			buildMasksTab({ element }),
		],
	};
}

function getImageConfig({
	element,
}: {
	element: ImageElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "transform",
		tabs: [
			buildTransformTab({ element }),
			buildKeyframesTab(),
			buildColorTab({ element }),
			buildMasksTab({ element }),
		],
	};
}

function getStickerConfig({
	element,
}: {
	element: StickerElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "transform",
		tabs: [buildTransformTab({ element }), buildKeyframesTab()],
	};
}

function getGraphicConfig({
	element,
}: {
	element: GraphicElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "graphic",
		tabs: [
			buildGraphicTab({ element }),
			buildTransformTab({ element }),
			buildKeyframesTab(),
			buildMasksTab({ element }),
		],
	};
}

function getAudioConfig({
	element,
}: {
	element: AudioElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "audio",
		tabs: [
			buildAudioTab({ element }),
			buildSpeedTab({ element }),
			buildKeyframesTab(),
		],
	};
}

function getEffectConfig({
	element,
}: {
	element: EffectElement;
}): ElementPropertiesConfig {
	return {
		defaultTab: "effects",
		tabs: [buildStandaloneEffectTab({ element })],
	};
}

export function getPropertiesConfig({
	element,
	mediaAssets,
}: {
	element: TimelineElement;
	mediaAssets: MediaAsset[];
}): ElementPropertiesConfig {
	switch (element.type) {
		case "text":
			return getTextConfig({ element });
		case "video": {
			const mediaAsset = mediaAssets.find((a) => a.id === element.mediaId);
			return getVideoConfig({ element, mediaAsset });
		}
		case "image":
			return getImageConfig({ element });
		case "sticker":
			return getStickerConfig({ element });
		case "graphic":
			return getGraphicConfig({ element });
		case "audio":
			return getAudioConfig({ element });
		case "effect":
			return getEffectConfig({ element });
		case "mask":
			return getMaskOverlayConfig({ element });
	}
}
