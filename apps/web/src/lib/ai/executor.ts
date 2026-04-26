import type { EditorCore } from "@/core";
import type { AIActionDiff } from "./types";
import type { ParamValues } from "@/lib/params";

export function executeAIDiff(editor: EditorCore, diff: AIActionDiff): void {
	for (const action of diff.actions) {
		executeAction(editor, action);
	}
}

function executeAction(
	editor: EditorCore,
	action: AIActionDiff["actions"][number],
): void {
	const elementId = action.target.elementId;
	if (!elementId) return;

	const trackId = findTrackIdBySearch(editor, elementId);
	if (!trackId) return;

	switch (action.type) {
		case "add-effect": {
			const effectType = action.payload.effectType as string;
			if (!effectType) break;
			editor.timeline.addClipEffect({ trackId, elementId, effectType });
			break;
		}
		case "remove-effect": {
			const effectId = action.payload.effectId as string;
			if (!effectId) break;
			editor.timeline.removeClipEffect({ trackId, elementId, effectId });
			break;
		}
		case "set-param": {
			const effectId = action.payload.effectId as string;
			const params = action.payload.params as Partial<ParamValues>;
			if (!effectId || !params) break;
			editor.timeline.updateClipEffectParams({
				trackId,
				elementId,
				effectId,
				params,
				pushHistory: true,
			});
			break;
		}
		case "set-transform": {
			const transform = action.payload.transform as Record<string, unknown>;
			if (!transform) break;
			editor.timeline.updateElements({
				updates: [{ trackId, elementId, patch: { transform } as never }],
				pushHistory: true,
			});
			break;
		}
		case "set-color": {
			const patch: Record<string, unknown> = {};
			if ("opacity" in action.payload) patch.opacity = action.payload.opacity;
			if ("blendMode" in action.payload)
				patch.blendMode = action.payload.blendMode;
			if ("color" in action.payload) patch.color = action.payload.color;
			if (Object.keys(patch).length === 0) break;
			editor.timeline.updateElements({
				updates: [{ trackId, elementId, patch: patch as never }],
				pushHistory: true,
			});
			break;
		}
		case "set-audio": {
			const patch: Record<string, unknown> = {};
			if ("volume" in action.payload) patch.volume = action.payload.volume;
			if ("muted" in action.payload) patch.muted = action.payload.muted;
			if (Object.keys(patch).length === 0) break;
			editor.timeline.updateElements({
				updates: [{ trackId, elementId, patch: patch as never }],
				pushHistory: true,
			});
			break;
		}
	}
}

function findTrackIdBySearch(
	editor: EditorCore,
	elementId: string,
): string | null {
	const activeScene = editor.scenes.getActiveSceneOrNull();
	if (!activeScene) return null;

	if (activeScene.tracks.main.elements.some((e) => e.id === elementId)) {
		return activeScene.tracks.main.id;
	}

	for (const track of activeScene.tracks.overlay) {
		if (track.elements.some((e) => e.id === elementId)) {
			return track.id;
		}
	}

	for (const track of activeScene.tracks.audio) {
		if (track.elements.some((e) => e.id === elementId)) {
			return track.id;
		}
	}

	return null;
}
