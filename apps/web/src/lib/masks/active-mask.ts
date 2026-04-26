import type { Mask } from "@/lib/masks/types";

export function resolveActiveMaskId({
	masks,
	activeMaskId,
}: {
	masks: Mask[];
	activeMaskId: string | null | undefined;
}): string | null {
	if (masks.length === 0) {
		return null;
	}

	if (activeMaskId && masks.some((mask) => mask.id === activeMaskId)) {
		return activeMaskId;
	}

	return masks[0]?.id ?? null;
}

export function getNextActiveMaskId({
	masks,
	activeMaskId,
	removedMaskId,
}: {
	masks: Mask[];
	activeMaskId: string | null | undefined;
	removedMaskId: string;
}): string | null {
	const remainingMasks = masks.filter((mask) => mask.id !== removedMaskId);

	if (remainingMasks.length === 0) {
		return null;
	}

	if (activeMaskId && activeMaskId !== removedMaskId) {
		return resolveActiveMaskId({ masks: remainingMasks, activeMaskId });
	}

	const removedIndex = masks.findIndex((mask) => mask.id === removedMaskId);
	const fallbackIndex = Math.min(removedIndex, remainingMasks.length - 1);

	return remainingMasks[fallbackIndex]?.id ?? remainingMasks[0]?.id ?? null;
}

export function appendMask({ masks, mask }: { masks: Mask[]; mask: Mask }): {
	masks: Mask[];
	activeMaskId: string;
} {
	return {
		masks: [...masks, mask],
		activeMaskId: mask.id,
	};
}

export function duplicateMask({
	masks,
	maskId,
	duplicateId,
}: {
	masks: Mask[];
	maskId: string;
	duplicateId: string;
}): {
	masks: Mask[];
	activeMaskId: string;
} | null {
	const sourceIndex = masks.findIndex((mask) => mask.id === maskId);
	if (sourceIndex === -1) {
		return null;
	}

	const sourceMask = masks[sourceIndex];
	const duplicatedMask = {
		...sourceMask,
		id: duplicateId,
		name: sourceMask.name?.trim()
			? `${sourceMask.name.trim()} Copy`
			: undefined,
		params: { ...sourceMask.params },
	};

	return {
		masks: [
			...masks.slice(0, sourceIndex + 1),
			duplicatedMask as (typeof masks)[number],
			...masks.slice(sourceIndex + 1),
		],
		activeMaskId: duplicatedMask.id,
	};
}

export function reorderMasks({
	masks,
	fromIndex,
	toIndex,
	activeMaskId,
}: {
	masks: Mask[];
	fromIndex: number;
	toIndex: number;
	activeMaskId: string | null | undefined;
}): {
	masks: Mask[];
	activeMaskId: string | null;
} | null {
	if (
		fromIndex < 0 ||
		toIndex < 0 ||
		fromIndex >= masks.length ||
		toIndex >= masks.length
	) {
		return null;
	}

	const nextMasks = [...masks];
	const [movedMask] = nextMasks.splice(fromIndex, 1);
	nextMasks.splice(toIndex, 0, movedMask);

	return {
		masks: nextMasks,
		activeMaskId: resolveActiveMaskId({ masks: nextMasks, activeMaskId }),
	};
}
