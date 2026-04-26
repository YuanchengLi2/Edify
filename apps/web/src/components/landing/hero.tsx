"use client";

import { Button } from "../ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Handlebars } from "./handlebars";
import Link from "next/link";

export function Hero() {
	return (
		<div className="relative flex min-h-[calc(100svh-4.5rem)] flex-col items-center overflow-hidden px-4 text-center">
			<div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-transparent" />
			<div className="absolute inset-0 -z-10 opacity-30">
				<div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-500/20 blur-[128px]" />
				<div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-[128px]" />
			</div>

			<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-8">
				<div className="mx-auto inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
					<Sparkles className="size-4 text-purple-400" />
					<span className="text-muted-foreground">
						AI-Powered Video Editing
					</span>
				</div>

				<h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
					Edit video with
					<br />
					<span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
						AI superpowers
					</span>
				</h1>

				<p className="text-muted-foreground mx-auto max-w-2xl text-lg font-light leading-relaxed md:text-xl">
					Professional video editing with AI assistance. Color grade, add
					effects, transitions, and let AI handle the heavy lifting. Free and
					open source.
				</p>

				<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Link href="/projects">
						<Button size="lg" className="h-12 px-8 text-base">
							Open Editor
							<ArrowRight className="ml-1 size-4" />
						</Button>
					</Link>
					<Link href="https://github.com/YuanchengLi2/Edify" target="_blank">
						<Button variant="outline" size="lg" className="h-12 px-8 text-base">
							View on GitHub
						</Button>
					</Link>
				</div>

				<div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4">
					<div className="flex flex-col items-center gap-2">
						<span className="text-2xl font-bold">10+</span>
						<span className="text-muted-foreground text-sm">
							Visual Effects
						</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<span className="text-2xl font-bold">AI</span>
						<span className="text-muted-foreground text-sm">Smart Editing</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<span className="text-2xl font-bold">Pro</span>
						<span className="text-muted-foreground text-sm">Color Grading</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<span className="text-2xl font-bold">0$</span>
						<span className="text-muted-foreground text-sm">Free Forever</span>
					</div>
				</div>
			</div>
		</div>
	);
}
