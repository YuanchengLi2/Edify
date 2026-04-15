import type { AIMessage, AIActionDiff } from "./types";
import { buildSystemPrompt } from "./prompt";
import { parseAIDiff } from "./diff";

interface AISendResult {
	ok: true;
	diff: AIActionDiff;
	content: string;
}

interface AIErrorResult {
	ok: false;
	error: string;
}

type SendResult = AISendResult | AIErrorResult;

export async function sendToAI(
	messages: AIMessage[],
	contextJson: string,
): Promise<SendResult> {
	const apiKey =
		process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "";
	const baseUrl =
		process.env.NEXT_PUBLIC_OPENAI_BASE_URL ??
		"https://api.openai.com/v1";

	if (!apiKey) {
		return { ok: false, error: "API key not configured" };
	}

	const systemPrompt = buildSystemPrompt();

	const apiMessages: Array<{ role: string; content: string }> = [
		{ role: "system", content: systemPrompt },
		{ role: "system", content: `Current editor context:\n${contextJson}` },
	];

	for (const msg of messages) {
		if (msg.role === "system") continue;
		apiMessages.push({ role: msg.role, content: msg.content });
	}

	try {
		const response = await fetch(`${baseUrl}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: apiMessages,
				temperature: 0.3,
			}),
		});

		if (!response.ok) {
			const text = await response.text();
			return {
				ok: false,
				error: `API error ${response.status}: ${text.slice(0, 200)}`,
			};
		}

		const data = (await response.json()) as {
			choices: Array<{ message: { content: string } }>;
		};

		const content = data.choices?.[0]?.message?.content ?? "";
		if (!content) {
			return { ok: false, error: "Empty response from API" };
		}

		const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
		const jsonStr = jsonMatch ? jsonMatch[1] : content;

		const parsed = parseAIDiff(jsonStr.trim());
		if (!parsed.ok) {
			return {
				ok: false,
				error: `Failed to parse AI response: ${parsed.error}`,
			};
		}

		return { ok: true, diff: parsed.diff, content: parsed.diff.reasoning };
	} catch (err) {
		return {
			ok: false,
			error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
		};
	}
}
