import { Command, type CommandResult } from "./base-command";
import { EditorCore } from "@/core";

export class BatchCommand extends Command {
	constructor(private commands: Command[]) {
		super();
	}

	execute(): CommandResult | undefined {
		let latestSelectionResult: CommandResult | undefined;

		if (this.commands.length <= 1) {
			for (const command of this.commands) {
				const result = command.execute();
				if (result?.select !== undefined) {
					latestSelectionResult = result;
				}
			}
			return latestSelectionResult;
		}

		const editor = EditorCore.getInstance();
		editor.scenes.batch(() => {
			editor.timeline.batch(() => {
				for (const command of this.commands) {
					const result = command.execute();
					if (result?.select !== undefined) {
						latestSelectionResult = result;
					}
				}
			});
		});

		return latestSelectionResult;
	}

	undo(): void {
		const editor = EditorCore.getInstance();
		editor.scenes.batch(() => {
			editor.timeline.batch(() => {
				for (const command of [...this.commands].reverse()) {
					command.undo();
				}
			});
		});
	}

	redo(): CommandResult | undefined {
		let latestSelectionResult: CommandResult | undefined;

		const editor = EditorCore.getInstance();
		editor.scenes.batch(() => {
			editor.timeline.batch(() => {
				for (const command of this.commands) {
					const result = command.redo();
					if (result?.select !== undefined) {
						latestSelectionResult = result;
					}
				}
			});
		});

		return latestSelectionResult;
	}
}
