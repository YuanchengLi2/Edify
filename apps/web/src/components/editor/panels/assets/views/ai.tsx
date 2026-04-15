"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useEditor } from "@/hooks/use-editor";
import { cn } from "@/utils/ui";

export function AIView() {
	const editor = useEditor();
	const ai = editor.ai;
	const messages = ai.messages;
	const isLoading = ai.isLoading;
	const [input, setInput] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages, isLoading]);

	const handleSend = useCallback(() => {
		const trimmed = input.trim();
		if (!trimmed || isLoading) return;
		setInput("");
		ai.sendMessage(trimmed);
	}, [input, isLoading, ai]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);

	return (
		<div className="flex h-full flex-col">
			<div className="bg-background h-11 shrink-0 pl-3 pr-2 flex items-center border-b">
				<span className="text-muted-foreground text-sm">AI Assistant</span>
			</div>

			<div
				ref={scrollRef}
				className="scrollbar-hidden flex-1 overflow-y-auto px-3 py-2"
			>
				{messages.length === 0 && !isLoading && (
					<div className="text-muted-foreground flex h-full items-center justify-center text-sm">
						Ask me to edit your video...
					</div>
				)}

				{messages.map((msg) => (
					<div
						key={msg.id}
						className={cn(
							"mb-2 flex",
							msg.role === "user" ? "justify-end" : "justify-start",
						)}
					>
						<div
							className={cn(
								"max-w-[85%] rounded-lg px-3 py-2 text-sm",
								msg.role === "user"
									? "bg-primary text-primary-foreground"
									: "bg-muted text-foreground",
							)}
						>
							<div>{msg.content}</div>
							{msg.actions && (
								<button
									type="button"
									className="mt-1.5 rounded bg-background/20 px-2 py-0.5 text-xs hover:bg-background/30"
									onClick={() => ai.applyAction(msg.actions!)}
								>
									Re-apply
								</button>
							)}
						</div>
					</div>
				))}

				{isLoading && (
					<div className="mb-2 flex justify-start">
						<div className="bg-muted max-w-[85%] rounded-lg px-3 py-2 text-sm">
							<div className="flex items-center gap-1.5">
								<span className="animate-pulse">Thinking</span>
								<span className="animate-pulse">...</span>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="border-t px-2 py-2">
				<div className="flex gap-2">
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Ask AI to edit..."
						disabled={isLoading}
						className="bg-background flex-1 rounded-md border px-3 py-1.5 text-sm outline-none disabled:opacity-50"
					/>
					<button
						type="button"
						onClick={handleSend}
						disabled={isLoading || !input.trim()}
						className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
					>
						Send
					</button>
				</div>
			</div>
		</div>
	);
}
