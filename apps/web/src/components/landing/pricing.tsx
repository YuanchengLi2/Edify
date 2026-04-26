"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight, Check } from "lucide-react";

const plans = [
	{
		name: "Free",
		price: "$0",
		period: "forever",
		description: "Everything you need to start editing.",
		features: [
			"AI editing assistant",
			"10+ visual effects",
			"Color grading",
			"Multi-track timeline",
			"Transitions",
			"Any aspect ratio",
			"Unlimited projects",
		],
		cta: "Open Editor",
		ctaHref: "/projects",
		highlighted: false,
	},
	{
		name: "Pro",
		price: "$12",
		period: "/month",
		description: "For creators who need more power.",
		features: [
			"Everything in Free",
			"4K export",
			"Custom brand kits",
			"Priority AI processing",
			"Cloud project sync",
			"Team collaboration",
			"Premium effects library",
		],
		cta: "Coming Soon",
		ctaHref: "#",
		highlighted: true,
	},
	{
		name: "Team",
		price: "$29",
		period: "/seat/mo",
		description: "For studios and production teams.",
		features: [
			"Everything in Pro",
			"Unlimited team members",
			"Shared asset library",
			"Project templates",
			"Review & approval flow",
			"Admin controls",
			"Dedicated support",
		],
		cta: "Coming Soon",
		ctaHref: "#",
		highlighted: false,
	},
];

export function Pricing() {
	return (
		<section className="border-t bg-background/50 px-4 py-24">
			<div className="mx-auto max-w-6xl">
				<div className="mb-16 text-center">
					<h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
						Simple, transparent pricing
					</h2>
					<p className="text-muted-foreground mx-auto max-w-2xl text-lg">
						Start free. Upgrade when you need more.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					{plans.map((plan) => (
						<div
							key={plan.name}
							className={`relative rounded-xl border p-8 transition-colors ${
								plan.highlighted
									? "border-purple-500/50 bg-purple-500/5"
									: "hover:border-purple-500/20"
							}`}
						>
							{plan.highlighted && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-3 py-0.5 text-xs font-medium text-white">
									Popular
								</div>
							)}
							<h3 className="text-lg font-semibold">{plan.name}</h3>
							<div className="mt-3 flex items-baseline gap-1">
								<span className="text-4xl font-bold">{plan.price}</span>
								<span className="text-muted-foreground text-sm">
									{plan.period}
								</span>
							</div>
							<p className="text-muted-foreground mt-2 text-sm">
								{plan.description}
							</p>
							<ul className="mt-6 space-y-3">
								{plan.features.map((feature) => (
									<li key={feature} className="flex items-center gap-2 text-sm">
										<Check className="size-4 shrink-0 text-purple-400" />
										{feature}
									</li>
								))}
							</ul>
							<div className="mt-8">
								<Link href={plan.ctaHref}>
									<Button
										variant={plan.highlighted ? "default" : "outline"}
										className="w-full"
										disabled={plan.cta === "Coming Soon"}
									>
										{plan.cta}
										{plan.cta !== "Coming Soon" && (
											<ArrowRight className="ml-1 size-4" />
										)}
									</Button>
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
