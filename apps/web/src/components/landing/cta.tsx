import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
	return (
		<section className="px-4 py-24">
			<div className="mx-auto max-w-3xl text-center">
				<h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
					Ready to start editing?
				</h2>
				<p className="text-muted-foreground mb-8 text-lg">
					Free, open source, and runs in your browser. No signup required.
				</p>
				<Link href="/projects">
					<Button size="lg" className="h-12 px-8 text-base">
						Open Editor
						<ArrowRight className="ml-1 size-4" />
					</Button>
				</Link>
			</div>
		</section>
	);
}
