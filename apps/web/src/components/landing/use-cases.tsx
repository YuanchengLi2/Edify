"use client";

import {
	Youtube,
	Instagram,
	Film,
	Presentation,
	GraduationCap,
	Podcast,
} from "lucide-react";

const useCases = [
	{
		icon: Youtube,
		title: "YouTube Creators",
		description:
			"Edit long-form videos with AI-assisted cuts, color grading, and transitions. Export in any format.",
	},
	{
		icon: Instagram,
		title: "Social Media",
		description:
			"Quickly create Reels, TikToks, and Shorts with 9:16 aspect ratio and fast turnaround.",
	},
	{
		icon: Film,
		title: "Filmmakers",
		description:
			"Professional color grading, effects, and multi-track editing for short films and documentaries.",
	},
	{
		icon: Presentation,
		title: "Marketing Teams",
		description:
			"Produce branded video content with consistent style across all your campaigns.",
	},
	{
		icon: GraduationCap,
		title: "Educators",
		description:
			"Create engaging tutorial and course videos with text overlays, captions, and smooth transitions.",
	},
	{
		icon: Podcast,
		title: "Podcasters",
		description:
			"Turn audio recordings into video with waveform visualizations, text, and branding.",
	},
];

export function UseCases() {
	return (
		<section className="px-4 py-24">
			<div className="mx-auto max-w-6xl">
				<div className="mb-16 text-center">
					<h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
						Built for every kind of creator
					</h2>
					<p className="text-muted-foreground mx-auto max-w-2xl text-lg">
						From social clips to short films — Edify adapts to your workflow.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{useCases.map((uc) => (
						<div
							key={uc.title}
							className="flex gap-4 rounded-xl border p-6 transition-colors hover:border-purple-500/20 hover:bg-purple-500/5"
						>
							<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
								<uc.icon className="size-6 text-purple-400" />
							</div>
							<div>
								<h3 className="mb-1 font-semibold">{uc.title}</h3>
								<p className="text-muted-foreground text-sm leading-relaxed">
									{uc.description}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
