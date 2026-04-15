import type { EditorCore } from "@/core";
import type { AIMessage, AIActionDiff } from "@/lib/ai/types";
import { buildAIContext } from "@/lib/ai/context";
import { executeAIDiff } from "@/lib/ai/executor";
import { parseAIDiff } from "@/lib/ai/diff";
import { sendToAI } from "@/lib/ai/openai";

export class AIManager {
	private listeners = new Set<() => void>();
	private _messages: AIMessage[] = [];
	private _isLoading = false;

	constructor(private editor: EditorCore) {}

	get messages(): AIMessage[] {
		return this._messages;
	}

	get isLoading(): boolean {
		return this._isLoading;
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	async sendMessage(content: string): Promise<void> {
		const userMessage: AIMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content,
			timestamp: Date.now(),
		};

		this._messages.push(userMessage);
		this._isLoading = true;
		this.notify();

		try {
			const context = buildAIContext(this.editor);
			const contextJson = JSON.stringify(context, null, 2);

			const result = await sendToAI(this._messages, contextJson);

			if (result.ok) {
				executeAIDiff(this.editor, result.diff);

				const assistantMessage: AIMessage = {
					id: crypto.randomUUID(),
					role: "assistant",
					content: result.content,
					timestamp: Date.now(),
					actions: result.diff,
				};
				this._messages.push(assistantMessage);
			} else {
				const errorMessage: AIMessage = {
					id: crypto.randomUUID(),
					role: "assistant",
					content: `Error: ${result.error}`,
					timestamp: Date.now(),
				};
				this._messages.push(errorMessage);
			}
		} catch {
			const errorMessage: AIMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: "An unexpected error occurred.",
				timestamp: Date.now(),
			};
			this._messages.push(errorMessage);
		} finally {
			this._isLoading = false;
			this.notify();
		}
	}

	async applyAction(diff: AIActionDiff): Promise<void> {
		executeAIDiff(this.editor, diff);
		this.notify();
	}

	clearMessages(): void {
		this._messages = [];
		this.notify();
	}

	private notify(): void {
		for (const fn of this.listeners) {
			fn();
		}
	}
}
