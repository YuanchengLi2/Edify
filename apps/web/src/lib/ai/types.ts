export interface AIAction {
	type:
		| "add-effect"
		| "remove-effect"
		| "set-param"
		| "set-color"
		| "set-transform"
		| "add-text"
		| "set-audio"
		| "set-transition";
	target: { elementType: string; elementId?: string; property?: string };
	payload: Record<string, unknown>;
}

export interface AIActionDiff {
	actions: AIAction[];
	reasoning: string;
	riskLevel: "low" | "medium" | "high";
}

export interface AIMessage {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: number;
	actions?: AIActionDiff;
}
