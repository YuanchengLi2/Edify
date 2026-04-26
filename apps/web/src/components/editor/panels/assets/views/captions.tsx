import { Button } from "@/components/ui/button";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useReducer, useRef, useState, useEffect } from "react";
import { useEditor } from "@/hooks/use-editor";
import { DEFAULT_TRANSCRIPTION_SAMPLE_RATE } from "@/lib/transcription/audio";
import { TRANSCRIPTION_LANGUAGES } from "@/lib/transcription/supported-languages";
import type {
	CaptionChunk,
	TranscriptionLanguage,
	TranscriptionProgress,
} from "@/lib/transcription/types";
import type { SubtitleCue } from "@/lib/subtitles/types";
import { transcriptionService } from "@/services/transcription/service";
import { buildCaptionChunks } from "@/lib/transcription/caption";
import { insertCaptionChunksAsTextTrack } from "@/lib/subtitles/insert";
import { parseSubtitleFile } from "@/lib/subtitles/parse";
import type { EditorCore } from "@/core";
import { Spinner } from "@/components/ui/spinner";
import {
	Section,
	SectionContent,
	SectionField,
	SectionFields,
} from "@/components/section";
import { CloudUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	type CaptionStyle,
	type CaptionPreset,
	getDefaultCaptionPreset,
	presetToSubtitleStyle,
} from "@/lib/captions";
import { loadFonts } from "@/lib/fonts/google-fonts";
import { collectAudibleCandidates } from "@/lib/media/audio";
import { extractTimelineAudio } from "@/lib/media/mediabunny";

type ProcessingState =
	| { status: "idle"; error: string | null; warnings: string[] }
	| { status: "processing"; step: string }
	| { status: "confirm-overwrite" };

type ProcessingAction =
	| { type: "start"; step: string }
	| { type: "update_step"; step: string }
	| { type: "succeed"; warnings: string[] }
	| { type: "fail"; error: string }
	| { type: "confirm_overwrite" }
	| { type: "cancel_overwrite" };

const IDLE_STATE: ProcessingState = {
	status: "idle",
	error: null,
	warnings: [],
};

function buildApproximateCaptionChunks({
	text,
	durationSeconds,
	chunkMode,
}: {
	text: string;
	durationSeconds: number;
	chunkMode: "single" | "short" | "sentence";
}): CaptionChunk[] {
	const words = text
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0);
	if (words.length === 0 || durationSeconds <= 0) {
		return [];
	}

	const chunkSize = chunkMode === "single" ? 1 : chunkMode === "short" ? 3 : 4;
	const groups: string[][] = [];
	for (let index = 0; index < words.length; index += chunkSize) {
		groups.push(words.slice(index, index + chunkSize));
	}

	const chunkDuration = Math.max(0.8, durationSeconds / groups.length);
	return groups.map((group, index) => {
		const startTime = index * chunkDuration;
		const endTime = Math.min(durationSeconds, startTime + chunkDuration);
		const localWordDuration = Math.max(
			0.12,
			(endTime - startTime) / group.length,
		);
		return {
			text: group.join(" "),
			startTime,
			duration: Math.max(0.4, endTime - startTime),
			wordTimings: group.map((word, wordIndex) => ({
				word,
				start: wordIndex * localWordDuration,
				end: Math.min(endTime - startTime, (wordIndex + 1) * localWordDuration),
			})),
		};
	});
}

function hasExistingCaptionTracks(editor: EditorCore): boolean {
	const tracks = editor.scenes.getActiveScene().tracks;
	const textTracks = tracks.overlay.filter((t) => t.type === "text");
	return textTracks.some((t) => t.elements.length > 0);
}

function processingReducer(
	state: ProcessingState,
	action: ProcessingAction,
): ProcessingState {
	switch (action.type) {
		case "start":
			return { status: "processing", step: action.step };
		case "update_step":
			if (state.status !== "processing") return state;
			return { status: "processing", step: action.step };
		case "succeed":
			return { status: "idle", error: null, warnings: action.warnings };
		case "fail":
			return { status: "idle", error: action.error, warnings: [] };
		case "confirm_overwrite":
			return { status: "confirm-overwrite" };
		case "cancel_overwrite":
			return IDLE_STATE;
	}
}

export function Captions() {
	const [selectedLanguage, setSelectedLanguage] =
		useState<TranscriptionLanguage>("auto");
	const [processing, dispatch] = useReducer(processingReducer, IDLE_STATE);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const editor = useEditor();
	const replaceModeRef = useRef(false);
	const selectedPreset: CaptionPreset = getDefaultCaptionPreset();

	const isProcessing = processing.status === "processing";
	const isConfirmOverwrite = processing.status === "confirm-overwrite";

	useEffect(() => {
		transcriptionService.preload();
	}, []);

	const handleProgress = (progress: TranscriptionProgress) => {
		if (progress.status === "loading-model") {
			dispatch({
				type: "update_step",
				step:
					progress.message ?? `Loading model ${Math.round(progress.progress)}%`,
			});
		} else if (progress.status === "transcribing") {
			dispatch({ type: "update_step", step: "Transcribing..." });
		}
	};

	const buildCaptionStyle = (): CaptionStyle | undefined => {
		return {
			presetId: selectedPreset.id,
			chunkMode: selectedPreset.chunkMode,
			category: selectedPreset.category,
			highlightColor: selectedPreset.style.highlightColor,
			highlightMode: selectedPreset.style.highlightMode,
			wordTimings: [],
			wordAnimation: selectedPreset.style.wordAnimation,
			wordAnimationDuration: selectedPreset.style.wordAnimationDuration,
			wordColorPalette: selectedPreset.style.wordColorPalette,
			highlightColorPalette: selectedPreset.style.highlightColorPalette,
		};
	};

	const insertCaptions = async ({
		captions,
		replaceExisting = false,
	}: {
		captions: CaptionChunk[];
		replaceExisting?: boolean;
	}): Promise<boolean> => {
		await loadFonts({ families: [selectedPreset.style.fontFamily] });
		const captionStyle = buildCaptionStyle();
		const styleOverrides = presetToSubtitleStyle(selectedPreset);
		const styledCaptions: SubtitleCue[] = captions.map((c) => ({
			...c,
			style: { ...styleOverrides },
		}));
		const trackId = insertCaptionChunksAsTextTrack({
			editor,
			captions: styledCaptions,
			captionStyle,
			replaceExisting,
		});
		return trackId !== null;
	};

	const handleGenerateClick = () => {
		if (hasExistingCaptionTracks(editor)) {
			replaceModeRef.current = true;
			dispatch({ type: "confirm_overwrite" });
			return;
		}
		replaceModeRef.current = false;
		void handleGenerateTranscript();
	};

	const handleGenerateTranscript = async () => {
		dispatch({ type: "start", step: "Extracting audio..." });
		try {
			const tracks = editor.scenes.getActiveScene().tracks;
			const mediaAssets = editor.media.getAssets();
			const candidates = collectAudibleCandidates({ tracks, mediaAssets });

			if (candidates.length === 0) {
				dispatch({
					type: "fail",
					error:
						"No audio found on the timeline. Add a video or audio clip with audio first.",
				});
				return;
			}

			dispatch({ type: "update_step", step: "Mixing timeline audio..." });

			const audioBlob = await extractTimelineAudio({
				tracks,
				mediaAssets,
				totalDuration: editor.timeline.getTotalDuration(),
			});

			dispatch({ type: "update_step", step: "Decoding timeline audio..." });

			const audioContext = new AudioContext({
				sampleRate: DEFAULT_TRANSCRIPTION_SAMPLE_RATE,
			});
			const arrayBuffer = await audioBlob.arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
			const numChannels = audioBuffer.numberOfChannels;
			const length = audioBuffer.length;
			const samples = new Float32Array(length);
			for (let i = 0; i < length; i++) {
				let sum = 0;
				for (let ch = 0; ch < numChannels; ch++) {
					sum += audioBuffer.getChannelData(ch)[i];
				}
				samples[i] = sum / numChannels;
			}
			const audioDurationSeconds = length / audioBuffer.sampleRate;
			await audioContext.close();

			const result = await transcriptionService.transcribe({
				audioData: samples,
				sampleRate: audioBuffer.sampleRate,
				language: selectedLanguage === "auto" ? undefined : selectedLanguage,
				onProgress: handleProgress,
			});

			dispatch({ type: "update_step", step: "Generating captions..." });
			let captionChunks = buildCaptionChunks({
				segments: result.segments,
				words: result.words,
				chunkMode: selectedPreset.chunkMode,
			});

			if (captionChunks.length === 0 && result.text.trim().length > 0) {
				captionChunks = buildApproximateCaptionChunks({
					text: result.text,
					durationSeconds: audioDurationSeconds,
					chunkMode: selectedPreset.chunkMode,
				});
			}

			if (
				!(await insertCaptions({
					captions: captionChunks,
					replaceExisting: replaceModeRef.current,
				}))
			) {
				dispatch({ type: "fail", error: "No captions were generated" });
				return;
			}

			dispatch({ type: "succeed", warnings: [] });
		} catch (error) {
			console.error("Transcription failed:", error);
			dispatch({
				type: "fail",
				error:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			});
		}
	};

	const handleImportClick = () => {
		fileInputRef.current?.click();
	};

	const handleImportFile = async ({ file }: { file: File }) => {
		dispatch({ type: "start", step: "Reading subtitle file..." });
		try {
			const input = await file.text();
			const result = parseSubtitleFile({
				fileName: file.name,
				input,
			});

			if (result.captions.length === 0) {
				dispatch({
					type: "fail",
					error: "No valid subtitle cues were found in the subtitle file",
				});
				return;
			}

			dispatch({ type: "update_step", step: "Importing subtitles..." });

			if (
				!(await insertCaptions({
					captions: result.captions,
					replaceExisting: true,
				}))
			) {
				dispatch({ type: "fail", error: "No captions were generated" });
				return;
			}

			const nextWarnings = [...result.warnings];
			if (result.skippedCueCount > 0) {
				nextWarnings.unshift(
					`Imported ${result.captions.length} subtitle cue(s) and skipped ${result.skippedCueCount} malformed cue(s).`,
				);
			}

			dispatch({ type: "succeed", warnings: nextWarnings });
		} catch (error) {
			console.error("Subtitle import failed:", error);
			dispatch({
				type: "fail",
				error:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			});
		}
	};

	const handleFileChange = async ({
		event,
	}: {
		event: React.ChangeEvent<HTMLInputElement>;
	}) => {
		const file = event.target.files?.[0];
		if (event.target) {
			event.target.value = "";
		}
		if (!file) return;

		await handleImportFile({ file });
	};

	const handleLanguageChange = ({ value }: { value: string }) => {
		if (value === "auto") {
			setSelectedLanguage("auto");
			return;
		}

		const matchedLanguage = TRANSCRIPTION_LANGUAGES.find(
			(language) => language.code === value,
		);
		if (!matchedLanguage) return;
		setSelectedLanguage(matchedLanguage.code);
	};

	const handleCancel = () => {
		transcriptionService.cancel();
		dispatch({ type: "fail", error: "Cancelled" });
	};

	const error = processing.status === "idle" ? processing.error : null;
	const warnings = processing.status === "idle" ? processing.warnings : [];

	return (
		<PanelView title="Captions" contentClassName="px-0 flex flex-col h-full">
			<input
				ref={fileInputRef}
				type="file"
				accept=".srt,.ass"
				className="hidden"
				onChange={(event) => void handleFileChange({ event })}
			/>
			<Section
				showTopBorder={false}
				showBottomBorder={false}
				className="flex-1"
			>
				<SectionContent className="flex flex-col gap-3 h-full pt-1">
					<SectionFields>
						<SectionField label="Language">
							<Select
								value={selectedLanguage}
								onValueChange={(value) => handleLanguageChange({ value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a language" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="auto">Auto detect</SelectItem>
									{TRANSCRIPTION_LANGUAGES.map((language) => (
										<SelectItem key={language.code} value={language.code}>
											{language.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</SectionField>
					</SectionFields>

					<div className="flex gap-2">
						<Button
							type="button"
							className="flex-1"
							onClick={isProcessing ? handleCancel : handleGenerateClick}
							variant={isProcessing ? "destructive" : "default"}
						>
							{isProcessing && <Spinner className="mr-1" />}
							{isProcessing ? "Cancel" : "Generate captions"}
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={handleImportClick}
							disabled={isProcessing}
							className="shrink-0"
							aria-label="Import subtitle file"
						>
							<HugeiconsIcon icon={CloudUploadIcon} size={16} />
						</Button>
					</div>

					{isProcessing && (
						<p className="text-muted-foreground text-xs text-center">
							{processing.status === "processing" ? processing.step : ""}
						</p>
					)}

					{isConfirmOverwrite && (
						<div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
							<p className="text-sm text-amber-700">
								Existing captions found. Replace them?
							</p>
							<div className="flex gap-2">
								<Button
									type="button"
									size="sm"
									onClick={() => {
										void handleGenerateTranscript();
									}}
								>
									Replace
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => dispatch({ type: "cancel_overwrite" })}
								>
									Cancel
								</Button>
							</div>
						</div>
					)}

					{error && (
						<div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
							<p className="text-destructive text-sm">{error}</p>
						</div>
					)}
					{warnings.length > 0 && (
						<div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
							<ul className="space-y-1 text-sm text-amber-700">
								{warnings.map((warning) => (
									<li key={warning}>{warning}</li>
								))}
							</ul>
						</div>
					)}
				</SectionContent>
			</Section>
		</PanelView>
	);
}
