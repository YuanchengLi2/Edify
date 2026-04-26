"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { DraggableItem } from "@/components/editor/panels/assets/draggable-item";
import { effectsRegistry, EFFECT_TARGET_ELEMENT_TYPES } from "@/lib/effects";
import {
	isClipFilterEffectType,
	isSceneEffectType,
} from "@/lib/effects/categories";
import { effectPreviewService } from "@/services/renderer/effect-preview";
import { useEditor } from "@/hooks/use-editor";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import { buildEffectElement } from "@/lib/timeline/element-utils";
import { isVisualElement } from "@/lib/timeline/element-utils";
import type { EffectDefinition } from "@/lib/effects/types";

export function EffectsView() {
	const effects = effectsRegistry.getAll();
	const clipFilters = useMemo(
		() => effects.filter((effect) => isClipFilterEffectType(effect.type)),
		[effects],
	);
	const sceneEffects = useMemo(
		() => effects.filter((effect) => isSceneEffectType(effect.type)),
		[effects],
	);

	return (
		<PanelView title="Effects">
			<div className="flex flex-col gap-4 p-3">
				<EffectsSection title="Filters" effects={clipFilters} />
				{sceneEffects.length > 0 && (
					<EffectsSection title="Scene Effects" effects={sceneEffects} />
				)}
			</div>
		</PanelView>
	);
}

function EffectsSection({
	title,
	effects,
}: {
	title: string;
	effects: EffectDefinition[];
}) {
	if (effects.length === 0) return null;

	return (
		<div className="flex flex-col gap-2">
			<div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
				{title}
			</div>
			<div
				className="grid gap-1"
				style={{ gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))" }}
			>
				{effects.map((effect) => (
					<EffectItem key={effect.type} effect={effect} />
				))}
			</div>
		</div>
	);
}

function EffectPreviewCanvas({ effectType }: { effectType: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const render = () => {
			if (canvasRef.current) {
				effectPreviewService.renderPreview({
					effectType,
					params: {},
					targetCanvas: canvasRef.current,
				});
			}
		};

		render();
		return effectPreviewService.onPreviewImageReady({ callback: render });
	}, [effectType]);

	return <canvas ref={canvasRef} className="size-full" />;
}

function EffectItem({ effect }: { effect: EffectDefinition }) {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();
	const selectedRef = selectedElements[0];
	const selectedVisual = useMemo(() => {
		if (!selectedRef) return null;
		const match = editor.timeline.getElementsWithTracks({
			elements: [selectedRef],
		})[0];
		if (!match || !isVisualElement(match.element)) return null;
		return match;
	}, [editor, selectedRef]);

	const handleAddToTimeline = useCallback(() => {
		if (isClipFilterEffectType(effect.type) && selectedVisual && selectedRef) {
			editor.timeline.addClipEffect({
				trackId: selectedRef.trackId,
				elementId: selectedVisual.element.id,
				effectType: effect.type,
			});
			return;
		}

		const currentTime = editor.playback.getCurrentTime();
		const element = buildEffectElement({
			effectType: effect.type,
			startTime: currentTime,
		});

		editor.timeline.insertElement({
			placement: { mode: "auto", trackType: "effect" },
			element,
		});
	}, [editor, effect.type, selectedRef, selectedVisual]);

	const preview = (
		<div className="relative size-full">
			<EffectPreviewCanvas effectType={effect.type} />
			<div className="absolute left-0.5 top-0.5 rounded bg-black/60 px-1 py-px text-[8px] font-medium text-white leading-tight">
				{isClipFilterEffectType(effect.type) ? "FX" : "Scene"}
			</div>
		</div>
	);

	return (
		<DraggableItem
			name={effect.name}
			preview={preview}
			dragData={{
				id: effect.type,
				name: effect.name,
				type: "effect",
				effectType: effect.type,
				targetElementTypes: EFFECT_TARGET_ELEMENT_TYPES,
			}}
			onAddToTimeline={handleAddToTimeline}
			aspectRatio={1}
			isRounded
			variant="card"
			containerClassName="w-full"
		/>
	);
}
