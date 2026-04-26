import type { Mask } from "@/lib/masks/types";
import { BaseNode } from "./base-node";

export type GlobalMaskNodeParams = {
	timeOffset: number;
	duration: number;
	masks: Mask[];
	activeMaskId?: string | null;
};

export type ResolvedGlobalMaskNodeState = {
	active: boolean;
	renderableMask: Mask | null;
};

export class GlobalMaskNode extends BaseNode<
	GlobalMaskNodeParams,
	ResolvedGlobalMaskNodeState
> {}
