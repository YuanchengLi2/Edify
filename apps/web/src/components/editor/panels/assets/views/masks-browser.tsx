"use client";

import { clearDragData, setDragData } from "@/lib/drag-data";
import { Input } from "@/components/ui/input";
import { masksRegistry } from "@/lib/masks";
import type { MaskType } from "@/lib/masks/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/utils/ui";
import { useMemo, useState } from "react";
import type { TimelineDragData } from "@/lib/timeline/drag";

const MASK_CATEGORIES: { id: string; label: string; types: MaskType[] }[] = [
	{
		id: "all",
		label: "All",
		types: [],
	},
	{
		id: "basic",
		label: "Basic",
		types: ["rectangle", "ellipse", "rounded-rect", "diamond"],
	},
	{
		id: "shapes",
		label: "Shapes",
		types: ["triangle", "pentagon", "hexagon", "octagon", "star", "heart"],
	},
	{
		id: "special",
		label: "Special",
		types: ["split", "cinematic-bars", "arrow", "cross"],
	},
];

export function MasksBrowserView() {
	const [activeCategory, setActiveCategory] = useState("all");
	const [query, setQuery] = useState("");

	const allMasks = useMemo(() => masksRegistry.getAll(), []);

	const visibleMasks = useMemo(() => {
		const filtered =
			activeCategory === "all"
				? allMasks
				: allMasks.filter((def) => {
						const cat = MASK_CATEGORIES.find((c) => c.id === activeCategory);
						return cat ? cat.types.includes(def.type) : true;
					});
		if (!query.trim()) return filtered;
		return filtered.filter((def) =>
			def.name.toLowerCase().includes(query.toLowerCase()),
		);
	}, [allMasks, activeCategory, query]);

	return (
		<div className="flex h-full flex-col">
			<div className="px-3 pt-2 pb-1">
				<Input
					size="sm"
					variant="default"
					placeholder="Search masks..."
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					showClearIcon
					onClear={() => setQuery("")}
					className="w-full"
					containerClassName="w-full"
				/>
			</div>
			<div className="flex gap-0.5 overflow-x-auto border-b border-border px-2 py-1 scrollbar-hidden">
				{MASK_CATEGORIES.map((cat) => (
					<button
						key={cat.id}
						type="button"
						onClick={() => setActiveCategory(cat.id)}
						className={cn(
							"flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
							activeCategory === cat.id
								? "bg-secondary text-secondary-foreground font-medium"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						{cat.label}
					</button>
				))}
			</div>

			<div className="px-3 pt-2 pb-1">
				<p className="text-muted-foreground text-xs">
					Drag a mask onto the timeline to mask everything below it
				</p>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-2 pt-1 pb-4">
				<div className="flex flex-col gap-0.5">
					{visibleMasks.map((def) => (
						<button
							key={def.type}
							type="button"
							draggable
							onDragStart={(event) => {
								const dragData: TimelineDragData = {
									id: def.type,
									name: def.name,
									type: "mask",
									maskType: def.type,
								};
								setDragData({
									dataTransfer: event.dataTransfer,
									dragData,
								});
								event.dataTransfer.effectAllowed = "copy";
							}}
							onDragEnd={() => clearDragData()}
							className={cn(
								"flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors cursor-grab hover:bg-muted/50 w-full active:cursor-grabbing",
							)}
						>
							<div className="flex size-7 items-center justify-center rounded-md bg-muted/60 shrink-0">
								<HugeiconsIcon
									icon={def.icon.icon}
									size={16}
									className="text-muted-foreground"
									strokeWidth={def.icon.strokeWidth ?? 1.5}
								/>
							</div>
							<span className="text-sm text-foreground truncate">
								{def.name}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
