import { create } from "zustand";

interface PropertiesState {
	activeTabPerType: Record<string, string>;
	setActiveTab: (elementType: string, tabId: string) => void;
	captionApplyToAll: boolean;
	setCaptionApplyToAll: (enabled: boolean) => void;
	isTransformScaleLocked: boolean;
	setTransformScaleLocked: (locked: boolean) => void;
	activeMaskByElement: Record<string, string | null | undefined>;
	setActiveMask: (args: {
		trackId: string;
		elementId: string;
		maskId: string | null;
	}) => void;
	clearActiveMask: (args: { trackId: string; elementId: string }) => void;
}

function getMaskSelectionKey({
	trackId,
	elementId,
}: {
	trackId: string;
	elementId: string;
}) {
	return `${trackId}:${elementId}`;
}

export const usePropertiesStore = create<PropertiesState>()((set) => ({
	activeTabPerType: {},
	setActiveTab: (elementType, tabId) =>
		set((state) => ({
			activeTabPerType: { ...state.activeTabPerType, [elementType]: tabId },
		})),
	captionApplyToAll: true,
	setCaptionApplyToAll: (enabled) => set({ captionApplyToAll: enabled }),
	isTransformScaleLocked: false,
	setTransformScaleLocked: (locked) => set({ isTransformScaleLocked: locked }),
	activeMaskByElement: {},
	setActiveMask: ({ trackId, elementId, maskId }) =>
		set((state) => ({
			activeMaskByElement: {
				...state.activeMaskByElement,
				[getMaskSelectionKey({ trackId, elementId })]: maskId,
			},
		})),
	clearActiveMask: ({ trackId, elementId }) =>
		set((state) => {
			const next = { ...state.activeMaskByElement };
			delete next[getMaskSelectionKey({ trackId, elementId })];
			return { activeMaskByElement: next };
		}),
}));
