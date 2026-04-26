"use client";

import {
	CAPTION_PRESETS,
	type CaptionPreset,
	VISIBLE_CAPTION_PRESET_IDS,
} from "@/lib/captions";
import { cn } from "@/utils/ui";
import { useEffect, useRef, useState } from "react";
import { loadFonts } from "@/lib/fonts/google-fonts";

interface CaptionPresetsGalleryProps {
	selectedPresetId: string | null;
	onSelectPreset: (preset: CaptionPreset | null) => void;
}

const SAMPLES: Record<string, string[]> = {
	"popup-1": ["THIS", "IS", "HOW"],
	"popup-short": ["HOW DID HE", "DO THAT"],
	sentence: ["This is how captions look"],
	"animated-sentence": ["This is how captions look"],
};

export function CaptionPresetsGallery({
	selectedPresetId,
	onSelectPreset,
}: CaptionPresetsGalleryProps) {
	useEffect(() => {
		const families = [
			...new Set(CAPTION_PRESETS.map((p) => p.style.fontFamily)),
		];
		loadFonts({ families }).catch(() => {});
	}, []);

	const presets = CAPTION_PRESETS.filter((p) =>
		VISIBLE_CAPTION_PRESET_IDS.includes(p.id),
	);

	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-2 gap-2">
				<NoneCard
					isSelected={selectedPresetId === null}
					onClick={() => onSelectPreset(null)}
				/>
				{presets.map((p) => (
					<Card
						key={p.id}
						preset={p}
						isSelected={selectedPresetId === p.id}
						onClick={() => onSelectPreset(p)}
					/>
				))}
			</div>
		</div>
	);
}

function NoneCard({
	isSelected,
	onClick,
}: {
	isSelected: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex flex-col items-start gap-1.5 rounded-lg border p-2 text-left transition-colors",
				isSelected
					? "border-primary bg-primary/10"
					: "border-border hover:border-primary/50",
			)}
		>
			<div className="flex h-[72px] w-full items-center justify-center rounded-md bg-[#0a0a0f] px-2">
				<span className="text-muted-foreground text-xs italic">
					No template
				</span>
			</div>
			<div className="w-full">
				<div className="truncate text-xs font-medium">None</div>
				<div className="truncate text-[11px] text-muted-foreground">
					Style manually
				</div>
			</div>
		</button>
	);
}

function Card({
	preset,
	isSelected,
	onClick,
}: {
	preset: CaptionPreset;
	isSelected: boolean;
	onClick: () => void;
}) {
	const [hovered, setHovered] = useState(false);
	const [step, setStep] = useState(0);
	const ref = useRef<ReturnType<typeof setInterval> | null>(null);

	const s = preset.style;
	const samples = SAMPLES[preset.category] ?? ["Caption"];
	const cat =
		preset.category === "popup-1"
			? "1-Word"
			: preset.category === "popup-short"
				? "2-3 Word"
				: preset.category === "sentence"
					? "Sentence"
					: "Animated";

	useEffect(() => {
		if (ref.current) clearInterval(ref.current);
		ref.current = null;
		setStep(0);
		if (!hovered) return;

		const ms =
			preset.chunkMode === "single"
				? 450
				: preset.chunkMode === "short"
					? 550
					: 300;
		let n = 0;
		ref.current = setInterval(() => {
			n++;
			setStep(n);
		}, ms);
		return () => {
			if (ref.current) clearInterval(ref.current);
		};
	}, [hovered, preset.chunkMode]);

	const cycleLen =
		preset.category === "popup-1"
			? samples.length
			: preset.category === "popup-short"
				? samples.length * 3
				: preset.category === "sentence"
					? 1
					: samples[0].split(/\s+/).length;

	const phase = step % (cycleLen + 1);

	let displayText: string;
	let hlWord = -1;

	if (!hovered || phase === 0) {
		displayText = samples[0];
	} else if (preset.category === "popup-1") {
		displayText = samples[(phase - 1) % samples.length];
		hlWord = 0;
	} else if (preset.category === "popup-short") {
		const phraseIndex = Math.floor((phase - 1) / 3) % samples.length;
		displayText = samples[phraseIndex];
		hlWord = (phase - 1) % 3;
	} else if (preset.category === "animated-sentence") {
		const allWords = samples[0].split(/\s+/);
		const count = Math.min(phase, allWords.length);
		displayText = allWords.slice(0, count).join(" ");
		hlWord = count - 1;
	} else {
		displayText = samples[0];
	}

	const words = displayText.split(/\s+/);

	const fSize =
		preset.category === "popup-1"
			? 22
			: preset.category === "popup-short"
				? 15
				: 12;

	const hasBg = s.background?.enabled;
	const bgStyle = hasBg
		? {
				backgroundColor: s.background.color,
				borderRadius: `${(s.background.cornerRadius ?? 0) / 2}px`,
				padding: "2px 6px",
			}
		: {};
	const hasStroke = (s.strokeWidth ?? 0) > 0 && s.strokeColor;
	const strokeStyle = hasStroke
		? { WebkitTextStroke: `${s.strokeWidth}px ${s.strokeColor}` }
		: {};

	return (
		<button
			type="button"
			onClick={onClick}
			onPointerEnter={() => setHovered(true)}
			onPointerLeave={() => setHovered(false)}
			className={cn(
				"flex flex-col items-start gap-1.5 rounded-lg border p-2 text-left transition-colors",
				isSelected
					? "border-primary bg-primary/10"
					: "border-border hover:border-primary/50",
			)}
		>
			<div className="flex h-[72px] w-full items-center justify-center rounded-md bg-[#0a0a0f] px-3 py-2">
				<div
					style={{
						...bgStyle,
						fontFamily: `${s.fontFamily}, sans-serif`,
						fontWeight: s.fontWeight ?? "bold",
						fontStyle: s.fontStyle ?? "normal",
						fontSize: fSize,
						lineHeight: 1.15,
						letterSpacing: s.letterSpacing ?? 0,
						color: s.color,
						textAlign: s.textAlign,
						overflow: "hidden",
						textOverflow: "ellipsis",
						maxWidth: "100%",
						...strokeStyle,
					}}
				>
					{words.map((w, i) => {
						const isHl = hovered && i === hlWord;
						return (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: positional preview words
								key={`w${i}`}
								style={{
									color: isHl ? s.highlightColor : s.color,
								}}
							>
								{w}{" "}
							</span>
						);
					})}
				</div>
			</div>
			<div className="w-full">
				<div className="truncate text-xs font-medium">{preset.name}</div>
				<div className="truncate text-[11px] text-muted-foreground">{cat}</div>
			</div>
		</button>
	);
}
