import type { AIActionDiff } from "./types";

interface ParseSuccess {
	ok: true;
	diff: AIActionDiff;
}

interface ParseFailure {
	ok: false;
	error: string;
}

type ParseResult = ParseSuccess | ParseFailure;

const VALID_ACTION_TYPES = new Set([
	"add-effect",
	"remove-effect",
	"set-param",
	"set-color",
	"set-transform",
	"add-text",
	"set-audio",
	"set-transition",
]);

const VALID_RISK_LEVELS = new Set(["low", "medium", "high"]);

export function parseAIDiff(raw: string): ParseResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return { ok: false, error: "Invalid JSON" };
	}

	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		return { ok: false, error: "Expected an object" };
	}

	const obj = parsed as Record<string, unknown>;

	if (!Array.isArray(obj.actions)) {
		return { ok: false, error: "Missing or invalid 'actions' array" };
	}

	if (typeof obj.reasoning !== "string") {
		return { ok: false, error: "Missing or invalid 'reasoning' string" };
	}

	if (!VALID_RISK_LEVELS.has(obj.riskLevel as string)) {
		return { ok: false, error: "Missing or invalid 'riskLevel'" };
	}

	for (let i = 0; i < obj.actions.length; i++) {
		const action = obj.actions[i] as Record<string, unknown>;
		if (!action || typeof action !== "object") {
			return { ok: false, error: `Action at index ${i} is not an object` };
		}

		if (!VALID_ACTION_TYPES.has(action.type as string)) {
			return {
				ok: false,
				error: `Action at index ${i} has invalid type: ${String(action.type)}`,
			};
		}

		if (!action.target || typeof action.target !== "object") {
			return {
				ok: false,
				error: `Action at index ${i} missing target`,
			};
		}

		if (typeof action.payload !== "object" || action.payload === null) {
			return {
				ok: false,
				error: `Action at index ${i} missing payload`,
			};
		}
	}

	return {
		ok: true,
		diff: {
			actions: obj.actions as AIActionDiff["actions"],
			reasoning: obj.reasoning as string,
			riskLevel: obj.riskLevel as AIActionDiff["riskLevel"],
		},
	};
}
