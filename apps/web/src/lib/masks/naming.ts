import type { Mask } from "@/lib/masks/types";
import type { MaskableElement } from "@/lib/timeline";

export function getMaskDisplayName({
	mask,
	fallbackName,
	index,
}: {
	mask: Mask;
	fallbackName: string;
	index: number;
}): string {
	if (mask.name?.trim()) {
		return mask.name.trim();
	}

	return `${fallbackName} ${index + 1}`;
}

export function renameMaskInElement({
	element,
	maskId,
	name,
}: {
	element: MaskableElement;
	maskId: string;
	name: string;
}): MaskableElement {
	const trimmedName = name.trim();

	return {
		...element,
		masks: (element.masks ?? []).map((mask) =>
			mask.id !== maskId
				? mask
				: {
						...mask,
						name: trimmedName || undefined,
					},
		),
	};
}
