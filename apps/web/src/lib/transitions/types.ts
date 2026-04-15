export type TransitionType =
	| "dissolve"
	| "wipe-left"
	| "wipe-right"
	| "wipe-up"
	| "wipe-down"
	| "slide-left"
	| "slide-right"
	| "zoom-in"
	| "zoom-out"
	| "fade-black"
	| "dip-white";

export interface Transition {
	type: TransitionType;
	duration: number;
}
