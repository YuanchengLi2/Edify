"use client";

import { Button } from "@/components/ui/button";
import { useTimelineStore } from "@/stores/timeline-store";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import { useEditor } from "@/hooks/use-editor";
import { getElementKeyframes } from "@/lib/animation";
import type { ElementKeyframe } from "@/lib/animation/types";
import { TICKS_PER_SECOND } from "@/lib/wasm";

function formatTime(ticks: number): string {
	const seconds = ticks / TICKS_PER_SECOND;
	return `${seconds.toFixed(1)}s`;
}

function getKeyframeLabel(kf: ElementKeyframe): string {
	if (
		kf.propertyPath === "transform.positionX" ||
		kf.propertyPath === "transform.positionY"
	)
		return "Position";
	if (
		kf.propertyPath === "transform.scaleX" ||
		kf.propertyPath === "transform.scaleY"
	)
		return "Scale";
	if (kf.propertyPath === "transform.rotate") return "Rotation";
	if (kf.propertyPath === "opacity") return "Opacity";
	if (kf.propertyPath === "color") return "Color";
	return kf.propertyPath;
}

export function KeyframesTab() {
	const { selectedElements } = useElementSelection();
	const editor = useEditor();
	const tracks = useEditor(
		(e) => e.timeline.getPreviewTracks() ?? e.scenes.getActiveScene().tracks,
	);
	const toggleElementExpanded = useTimelineStore(
		(s) => s.toggleElementExpanded,
	);
	const expandedElementIds = useTimelineStore((s) => s.expandedElementIds);

	const selectedElement = selectedElements[0];
	const isExpanded = selectedElement
		? expandedElementIds.has(selectedElement.elementId)
		: false;

	if (!selectedElement) {
		return null;
	}

	const allTracks = [tracks.main, ...tracks.overlay, ...tracks.audio];
	const element = allTracks
		.find((track) => track.id === selectedElement.trackId)
		?.elements.find((candidate) => candidate.id === selectedElement.elementId);
	const keyframes = element
		? getElementKeyframes({ animations: element.animations })
		: [];

	const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);
	const uniqueTimes = [...new Set(sortedKeyframes.map((kf) => kf.time))];
	const groupedAtTime = uniqueTimes.map((time) => ({
		time,
		keyframes: sortedKeyframes.filter((kf) => kf.time === time),
	}));

	const handleSeekToKeyframe = (time: number) => {
		if (!element) return;
		editor.playback.seek({ time: element.startTime + time });
	};

	return (
		<div className="flex h-full flex-col gap-4 p-4">
			<div className="space-y-2">
				<h3 className="text-sm font-medium">
					Keyframes ({uniqueTimes.length})
				</h3>
				<p className="text-muted-foreground text-xs">
					Drag elements on canvas to auto-create position keyframes. Use the
					diamond button in the toolbar to add keyframes for all properties.
				</p>
			</div>

			{groupedAtTime.length > 0 && (
				<div className="flex flex-col gap-1">
					{groupedAtTime.map((group, index) => (
						<button
							key={group.time}
							type="button"
							className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors"
							onClick={() => handleSeekToKeyframe(group.time)}
						>
							<span className="text-muted-foreground font-mono">
								{formatTime(group.time)}
							</span>
							<span className="text-muted-foreground truncate ml-2">
								{[...new Set(group.keyframes.map(getKeyframeLabel))].join(", ")}
							</span>
						</button>
					))}
				</div>
			)}

			{groupedAtTime.length === 0 && (
				<p className="text-muted-foreground text-xs italic">
					No keyframes yet. Move the playhead and drag the element to create
					one.
				</p>
			)}

			<Button
				variant="secondary"
				onClick={() => toggleElementExpanded(selectedElement.elementId)}
			>
				{isExpanded ? "Hide timeline keyframes" : "Show timeline keyframes"}
			</Button>
		</div>
	);
}
