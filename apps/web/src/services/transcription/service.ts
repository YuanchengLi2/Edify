import type {
	TranscriptionLanguage,
	TranscriptionResult,
	TranscriptionProgress,
} from "@/lib/transcription/types";

type ProgressCallback = (progress: TranscriptionProgress) => void;

class TranscriptionService {
	preload() {
		return Promise.resolve();
	}

	async transcribe({
		audioData,
		sampleRate = 16000,
		language = "auto",
		onProgress,
	}: {
		audioData: Float32Array;
		sampleRate?: number;
		language?: TranscriptionLanguage;
		onProgress?: ProgressCallback;
	}): Promise<TranscriptionResult> {
		onProgress?.({
			status: "transcribing",
			progress: 10,
			message: "Preparing audio...",
		});

		try {
			const wavBlob = this.encodeWAV(audioData, sampleRate);
			const formData = new FormData();
			formData.append("file", wavBlob, "audio.wav");

			if (language && language !== "auto") {
				formData.append("language", language);
			}

			onProgress?.({
				status: "transcribing",
				progress: 30,
				message: "Uploading for transcription...",
			});

			const res = await fetch("/api/transcribe", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to transcribe audio");
			}

			onProgress?.({
				status: "transcribing",
				progress: 90,
				message: "Parsing results...",
			});

			const data = await res.json();
			return {
				text: data.text,
				language: language,
				segments: data.segments?.map((s: any) => ({
					start: s.start,
					end: s.end,
					text: s.text,
				})) || [],
				words: data.words?.map((w: any) => ({
					start: w.start,
					end: w.end,
					text: w.word,
				})) || [],
			};
		} catch (err: any) {
			onProgress?.({
				status: "error",
				progress: 0,
				message: err?.message || "Error",
			});
			throw err;
		}
	}

	cancel() {
		// No-op for fetch API without AbortController
	}

	private encodeWAV(samples: Float32Array, sampleRate: number): Blob {
		const buffer = new ArrayBuffer(44 + samples.length * 2);
		const view = new DataView(buffer);

		const writeString = (offset: number, str: string) => {
			for (let i = 0; i < str.length; i++) {
				view.setUint8(offset + i, str.charCodeAt(i));
			}
		};

		writeString(0, "RIFF");
		view.setUint32(4, 36 + samples.length * 2, true);
		writeString(8, "WAVE");
		writeString(12, "fmt ");
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, 1, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * 2, true);
		view.setUint16(32, 2, true);
		view.setUint16(34, 16, true);
		writeString(36, "data");
		view.setUint32(40, samples.length * 2, true);

		let offset = 44;
		for (let i = 0; i < samples.length; i++, offset += 2) {
			let s = Math.max(-1, Math.min(1, samples[i]));
			view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}

		return new Blob([buffer], { type: "audio/wav" });
	}

	terminate() {}
}

export const transcriptionService = new TranscriptionService();
