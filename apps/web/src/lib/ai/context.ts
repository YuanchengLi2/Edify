import type { EditorCore } from "@/core";
import { isVisualElement } from "@/lib/timeline/element-utils";
import { frameRateToFloat } from "@/lib/fps/utils";
import type { FrameRate } from "opencut-wasm";

interface AIContext {
	project: {
		fps: number;
		width: number;
		height: number;
	} | null;
	currentTime: number;
	totalDuration: number;
	selectedElements: Array<{
		trackId: string;
		elementId: string;
		type: string;
		name: string;
		properties: Record<string, unknown>;
		effects?: Array<{ id: string; type: string; enabled: boolean }>;
	}>;
	sceneName: string | null;
}

export function buildAIContext(editor: EditorCore): AIContext {
	const activeScene = editor.scenes.getActiveSceneOrNull();
	const selectedRefs = editor.selection.getSelectedElements();

	const projectSettings = editor.project.getActive()?.settings ?? null;

	const selectedElements: AIContext["selectedElements"] = [];

	for (const ref of selectedRefs) {
		const track = editor.timeline.getTrackById({ trackId: ref.trackId });
		if (!track) continue;

		const element = track.elements.find((e) => e.id === ref.elementId);
		if (!element) continue;

		const properties: Record<string, unknown> = {
			duration: element.duration,
			startTime: element.startTime,
			trimStart: element.trimStart,
			trimEnd: element.trimEnd,
		};

		if (isVisualElement(element)) {
			properties.transform = element.transform;
			properties.opacity = element.opacity;
		}

		if ("volume" in element) {
			properties.volume = element.volume;
		}

		if ("muted" in element) {
			properties.muted = element.muted;
		}

		if ("color" in element) {
			properties.color = element.color;
		}

		if ("content" in element) {
			properties.content = element.content;
		}

		const entry: AIContext["selectedElements"][number] = {
			trackId: ref.trackId,
			elementId: ref.elementId,
			type: element.type,
			name: element.name,
			properties,
		};

		if (isVisualElement(element) && element.effects) {
			entry.effects = element.effects.map((e) => ({
				id: e.id,
				type: e.type,
				enabled: e.enabled,
			}));
		}

		selectedElements.push(entry);
	}

	return {
		project: projectSettings
			? {
					fps: frameRateToFloat(projectSettings.fps as FrameRate),
					width: projectSettings.canvasSize.width,
					height: projectSettings.canvasSize.height,
				}
			: null,
		currentTime: editor.playback.getCurrentTime(),
		totalDuration: editor.timeline.getTotalDuration(),
		selectedElements,
		sceneName: activeScene?.name ?? null,
	};
}
