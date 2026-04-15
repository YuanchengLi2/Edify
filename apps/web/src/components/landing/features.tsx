"use client";

import {
	Sparkles,
	Palette,
	Wand2,
	Music,
	Monitor,
	Zap,
	Layers,
	Brain,
} from "lucide-react";

const features = [
	{
		icon: Brain,
		title: "AI Editing Assistant",
		description:
			"Tell the AI what you want. It adds effects, adjusts color, and transforms your footage intelligently.",
	},
	{
		icon: Palette,
		title: "Professional Color Grading",
		description:
			"Full color control with exposure, contrast, temperature, highlights, shadows, and vibrance sliders.",
	},
	{
		icon: Wand2,
		title: "10+ Visual Effects",
		description:
			"Blur, vignette, sharpen, film grain, glow, chromatic aberration, glitch, and more.",
	},
	{
		icon: Layers,
		title: "Multi-Track Timeline",
		description:
			"Unlimited video, audio, text, and effect tracks. Drag, drop, trim, and snap with precision.",
	},
	{
		icon: Music,
		title: "Audio Mixing",
		description:
			"Volume control, mute toggles, waveforms, and audio separation per clip.",
	},
	{
		icon: Monitor,
		title: "Any Aspect Ratio",
		description:
			"16:9, 9:16, 1:1, 4:5 — switch freely with live preview letterboxing.",
	},
	{
		icon: Zap,
		title: "Transitions",
		description:
			"Dissolve, wipes, slides, fades, zooms. Add polish with smooth clip transitions.",
	},
	{
		icon: Sparkles,
		title: "Open Source",
		description:
			"Free forever. Built on open-source foundations. Contribute, fork, or self-host.",
	},
];

export function Features() {
	return (
		<section id="features" className="border-t bg-background/50 px-4 py-24">
			<div className="mx-auto max-w-6xl">
				<div className="mb-16 text-center">
					<h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
						Everything you need to edit video
					</h2>
					<p className="text-muted-foreground mx-auto max-w-2xl text-lg">
						Professional editing tools powered by AI, all in one free
						application.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="group rounded-xl border p-6 transition-colors hover:border-purple-500/30 hover:bg-purple-500/5"
						>
							<feature.icon className="text-muted-foreground mb-4 size-8 transition-colors group-hover:text-purple-400" />
							<h3 className="mb-2 font-semibold">{feature.title}</h3>
							<p className="text-muted-foreground text-sm leading-relaxed">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
