import { NextResponse } from "next/server";

export const maxDuration = 60; // Max allowed for Vercel/Next.js hosting for audio proxy

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			return NextResponse.json(
				{ error: "No audio file provided" },
				{ status: 400 },
			);
		}

		if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
			return NextResponse.json(
				{ error: "OpenAI API key missing from environment" },
				{ status: 500 },
			);
		}

		const openAiFormData = new FormData();
		openAiFormData.append("file", file);
		openAiFormData.append("model", "whisper-1");
		openAiFormData.append("response_format", "verbose_json");
		openAiFormData.append("timestamp_granularities[]", "word");

		// Map 'auto' to no language parameter so whisper auto-detects
		const language = formData.get("language");
		if (language && language !== "auto" && typeof language === "string") {
			openAiFormData.append("language", language);
		}

		const response = await fetch(
			"https://api.openai.com/v1/audio/transcriptions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
				},
				body: openAiFormData,
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			return NextResponse.json(
				{ error: `OpenAI API Error: ${errorText}` },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Transcription error:", error);
		return NextResponse.json(
			{ error: "Internal server error during transcription" },
			{ status: 500 },
		);
	}
}
