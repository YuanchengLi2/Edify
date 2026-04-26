"use client";

import { useState, useEffect, useMemo } from "react";
import { useEditor } from "@/hooks/use-editor";
import { formatTimecode } from "opencut-wasm";
import { invokeAction } from "@/lib/actions";
import { EditableTimecode } from "@/components/editable-timecode";
import { Button } from "@/components/ui/button";
import {
	FullScreenIcon,
	PauseIcon,
	PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getGuideById } from "@/lib/guides";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectSeparator,
} from "@/components/ui/select";
import { PREVIEW_ZOOM_PRESETS } from "@/lib/preview/zoom";
import {
	ASPECT_PRESETS,
	ASPECT_PRESET_SIZES,
	type AspectPresetKey,
} from "@/lib/canvas/aspect-presets";
import { usePreviewViewport } from "./preview-viewport";
import { usePreviewStore } from "@/stores/preview-store";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import {
	getElementKeyframes,
	resolveColorAtTime,
	resolveNumberAtTime,
	resolveOpacityAtTime,
	resolveTransformAtTime,
} from "@/lib/animation";
import type { AnimationPath } from "@/lib/animation/types";
import { isVisualElement } from "@/lib/timeline/element-utils";
import type { TextElement } from "@/lib/timeline";
import {
	KeyframeAddIcon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

export function PreviewToolbar({
	onToggleFullscreen,
}: {
	onToggleFullscreen: () => void;
}) {
	const activeGuide = usePreviewStore((state) => state.activeGuide);
	const _activeGuideDefinition = getGuideById(activeGuide);

	return (
		<div className="grid grid-cols-[1fr_auto_1fr] items-center pb-3 pt-5 px-5">
			<TimecodeDisplay />
			<div className="flex items-center gap-2">
				<PlayPauseButton />
				<KeyframeControls />
			</div>
			<div className="justify-self-end flex items-center gap-2.5">
				<AspectRatioSelect />
				<ZoomSelect />
				<Separator orientation="vertical" className="h-4" />
				<Button variant="text" onClick={onToggleFullscreen}>
					<HugeiconsIcon icon={FullScreenIcon} />
				</Button>
			</div>
		</div>
	);
}

function TimecodeDisplay() {
	const editor = useEditor();
	const totalDuration = useEditor((e) => e.timeline.getTotalDuration());
	const fps = useEditor((e) => e.project.getActive().settings.fps);
	const [currentTime, setCurrentTime] = useState(() =>
		editor.playback.getCurrentTime(),
	);

	useEffect(() => {
		const handler = (e: Event) =>
			setCurrentTime((e as CustomEvent<{ time: number }>).detail.time);
		window.addEventListener("playback-update", handler);
		window.addEventListener("playback-seek", handler);
		return () => {
			window.removeEventListener("playback-update", handler);
			window.removeEventListener("playback-seek", handler);
		};
	}, []);

	return (
		<div className="flex items-center">
			<EditableTimecode
				time={currentTime}
				duration={totalDuration}
				format="HH:MM:SS:FF"
				fps={fps}
				onTimeChange={({ time }) => editor.playback.seek({ time })}
				className="text-center"
			/>
			<span className="text-muted-foreground px-2 font-mono text-xs">/</span>
			<span className="text-muted-foreground font-mono text-xs">
				{formatTimecode({
					time: totalDuration,
					format: "HH:MM:SS:FF",
					rate: fps,
				})}
			</span>
		</div>
	);
}

function AspectRatioSelect() {
	const editor = useEditor();
	const aspectRatio = usePreviewStore((s) => s.aspectRatio);
	const setAspectRatio = usePreviewStore((s) => s.setAspectRatio);

	const handleValueChange = (value: string) => {
		const nextAspectRatio = value as AspectPresetKey;
		setAspectRatio(nextAspectRatio);
		editor.project.updateSettings({
			settings: {
				canvasSize: ASPECT_PRESET_SIZES[nextAspectRatio],
				canvasSizeMode: "preset",
			},
		});
	};

	return (
		<Select value={aspectRatio} onValueChange={handleValueChange}>
			<SelectTrigger className="tabular-nums">{aspectRatio}</SelectTrigger>
			<SelectContent>
				{(Object.keys(ASPECT_PRESETS) as AspectPresetKey[]).map((key) => (
					<SelectItem key={key} value={key}>
						{key}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function ZoomSelect() {
	const { isAtFit, zoomPercent, fitToScreen, setViewportPercent } =
		usePreviewViewport();

	const displayLabel = isAtFit ? "Fit" : `${zoomPercent}%`;

	const onValueChange = (value: string) => {
		if (value === "fit") {
			fitToScreen();
		} else {
			setViewportPercent({ percent: Number(value) });
		}
	};

	return (
		<Select
			value={isAtFit ? "fit" : String(zoomPercent)}
			onValueChange={onValueChange}
		>
			<SelectTrigger className="tabular-nums">{displayLabel}</SelectTrigger>
			<SelectContent>
				<SelectItem value="fit">Fit</SelectItem>
				<SelectSeparator />
				{PREVIEW_ZOOM_PRESETS.map((preset) => (
					<SelectItem key={preset} value={String(preset)}>
						{preset}%
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function PlayPauseButton() {
	const isPlaying = useEditor((e) => e.playback.getIsPlaying());

	return (
		<Button
			variant="text"
			size="icon"
			onClick={() => invokeAction("toggle-play")}
		>
			<HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} />
		</Button>
	);
}

function KeyframeControls() {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();
	const currentTime = useEditor((e) => e.playback.getCurrentTime());
	const tracks = useEditor(
		(e) => e.timeline.getPreviewTracks() ?? e.scenes.getActiveScene().tracks,
	);

	const selectedRef = selectedElements[0];
	const element = useMemo(() => {
		if (!selectedRef) return null;
		const allTracks = [tracks.main, ...tracks.overlay, ...tracks.audio];
		const track = allTracks.find(
			(candidate) => candidate.id === selectedRef.trackId,
		);
		return (
			track?.elements.find(
				(candidate) => candidate.id === selectedRef.elementId,
			) ?? null
		);
	}, [selectedRef, tracks]);

	const keyframes = useMemo(
		() =>
			element ? getElementKeyframes({ animations: element.animations }) : [],
		[element],
	);

	const isPlayheadWithinElementRange = Boolean(
		element &&
			currentTime >= element.startTime &&
			currentTime <= element.startTime + element.duration,
	);
	const localTime = element ? currentTime - element.startTime : -1;

	const hasKeyframeAtPlayhead =
		element &&
		isPlayheadWithinElementRange &&
		keyframes.some((kf) => Math.abs(kf.time - localTime) <= 1);

	const isVisual = element && isVisualElement(element);

	const handleAddKeyframe = () => {
		if (!selectedRef || !element || !isVisual || !isPlayheadWithinElementRange)
			return;

		const t = resolveTransformAtTime({
			baseTransform: element.transform,
			animations: element.animations,
			localTime,
		});
		const opacity = resolveOpacityAtTime({
			baseOpacity: element.opacity,
			animations: element.animations,
			localTime,
		});

		const keyframes: Array<{
			trackId: string;
			elementId: string;
			propertyPath: AnimationPath;
			time: number;
			value: number | string;
		}> = [
			{
				trackId: selectedRef.trackId,
				elementId: selectedRef.elementId,
				propertyPath: "transform.positionX",
				time: localTime,
				value: t.position.x,
			},
			{
				trackId: selectedRef.trackId,
				elementId: selectedRef.elementId,
				propertyPath: "transform.positionY",
				time: localTime,
				value: t.position.y,
			},
			{
				trackId: selectedRef.trackId,
				elementId: selectedRef.elementId,
				propertyPath: "transform.scaleX",
				time: localTime,
				value: t.scaleX,
			},
			{
				trackId: selectedRef.trackId,
				elementId: selectedRef.elementId,
				propertyPath: "transform.scaleY",
				time: localTime,
				value: t.scaleY,
			},
			{
				trackId: selectedRef.trackId,
				elementId: selectedRef.elementId,
				propertyPath: "transform.rotate",
				time: localTime,
				value: t.rotate,
			},
			{
				trackId: selectedRef.trackId,
				elementId: selectedRef.elementId,
				propertyPath: "opacity",
				time: localTime,
				value: opacity,
			},
		];

		if (element.type === "text") {
			const textEl = element as TextElement;
			const bgColor = resolveColorAtTime({
				baseColor: textEl.background.color,
				animations: textEl.animations,
				propertyPath: "background.color",
				localTime,
			});
			const bgPaddingX = resolveNumberAtTime({
				baseValue: textEl.background.paddingX ?? 0,
				animations: textEl.animations,
				propertyPath: "background.paddingX",
				localTime,
			});
			const bgPaddingY = resolveNumberAtTime({
				baseValue: textEl.background.paddingY ?? 0,
				animations: textEl.animations,
				propertyPath: "background.paddingY",
				localTime,
			});
			const bgOffsetX = resolveNumberAtTime({
				baseValue: textEl.background.offsetX ?? 0,
				animations: textEl.animations,
				propertyPath: "background.offsetX",
				localTime,
			});
			const bgOffsetY = resolveNumberAtTime({
				baseValue: textEl.background.offsetY ?? 0,
				animations: textEl.animations,
				propertyPath: "background.offsetY",
				localTime,
			});
			const bgCornerRadius = resolveNumberAtTime({
				baseValue: textEl.background.cornerRadius ?? 0,
				animations: textEl.animations,
				propertyPath: "background.cornerRadius",
				localTime,
			});
			const textColor = resolveColorAtTime({
				baseColor: textEl.color,
				animations: textEl.animations,
				propertyPath: "color",
				localTime,
			});
			keyframes.push(
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					propertyPath: "color",
					time: localTime,
					value: textColor,
				},
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					propertyPath: "background.color",
					time: localTime,
					value: bgColor,
				},
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					propertyPath: "background.paddingX",
					time: localTime,
					value: bgPaddingX,
				},
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					propertyPath: "background.paddingY",
					time: localTime,
					value: bgPaddingY,
				},
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					propertyPath: "background.offsetX",
					time: localTime,
					value: bgOffsetX,
				},
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					propertyPath: "background.offsetY",
					time: localTime,
					value: bgOffsetY,
				},
				{
					trackId: selectedRef.trackId,
					elementId: selectedRef.elementId,
					propertyPath: "background.cornerRadius",
					time: localTime,
					value: bgCornerRadius,
				},
			);
		}

		editor.timeline.upsertKeyframes({ keyframes });
	};

	const sortedTimes = useMemo(
		() => [...new Set(keyframes.map((kf) => kf.time))].sort((a, b) => a - b),
		[keyframes],
	);

	const handlePrevKeyframe = () => {
		if (!element || sortedTimes.length === 0) return;
		const prev = sortedTimes.filter((t) => t < localTime).pop();
		if (prev !== undefined) {
			editor.playback.seek({ time: element.startTime + prev });
		}
	};

	const handleNextKeyframe = () => {
		if (!element || sortedTimes.length === 0) return;
		const next = sortedTimes.find((t) => t > localTime);
		if (next !== undefined) {
			editor.playback.seek({ time: element.startTime + next });
		}
	};

	if (!selectedRef || !isVisual) return null;

	return (
		<>
			<Separator orientation="vertical" className="h-4" />
			<Button
				variant="text"
				size="icon"
				onClick={handlePrevKeyframe}
				disabled={sortedTimes.length === 0}
				title="Previous keyframe"
			>
				<HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
			</Button>
			<Button
				variant="text"
				size="icon"
				onClick={handleNextKeyframe}
				disabled={sortedTimes.length === 0}
				title="Next keyframe"
			>
				<HugeiconsIcon icon={ArrowRight01Icon} size={16} />
			</Button>
			<Separator orientation="vertical" className="h-4" />
			<Button
				variant={hasKeyframeAtPlayhead ? "secondary" : "text"}
				size="icon"
				onClick={handleAddKeyframe}
				disabled={!isPlayheadWithinElementRange}
				title={
					isPlayheadWithinElementRange
						? "Add or update keyframe"
						: "Move the playhead onto the clip to add keyframes"
				}
			>
				<HugeiconsIcon icon={KeyframeAddIcon} size={16} />
			</Button>
		</>
	);
}
