import type { Mask, MaskDefinition } from "@/lib/masks/types";
import type { MaskableElement } from "@/lib/timeline";

export function filterMaskDefinitions<
	TDefinition extends Pick<MaskDefinition, "type" | "name">,
>({
	definitions,
	query,
}: {
	definitions: readonly TDefinition[];
	query: string;
}): TDefinition[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return [...definitions];
	}

	return definitions.filter((definition) => {
		const haystack = `${definition.name} ${definition.type}`.toLowerCase();
		return haystack.includes(normalizedQuery);
	});
}

export function isMaskVisible(mask: Mask): boolean {
	return mask.visible ?? true;
}

export function getRenderableMask({
	masks,
	activeMaskId,
}: {
	masks?: Mask[] | null;
	activeMaskId?: string | null;
}): Mask | null {
	if (!masks?.length) {
		return null;
	}

	if (activeMaskId) {
		const activeMask = masks.find(
			(mask) => mask.id === activeMaskId && isMaskVisible(mask),
		);
		if (activeMask) {
			return activeMask;
		}
	}

	return masks.find((mask) => isMaskVisible(mask)) ?? null;
}

export function toggleMaskVisibilityInElement({
	element,
	maskId,
}: {
	element: MaskableElement;
	maskId: string;
}): MaskableElement {
	return {
		...element,
		masks: (element.masks ?? []).map((mask) =>
			mask.id !== maskId ? mask : { ...mask, visible: !isMaskVisible(mask) },
		),
	};
}
