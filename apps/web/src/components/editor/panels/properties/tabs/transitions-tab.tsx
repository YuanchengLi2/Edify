import { useEditor } from "@/hooks/use-editor";
import { Slider } from "@/components/ui/slider";
import type { VideoElement } from "@/lib/timeline";
import type { Transition, TransitionType } from "@/lib/transitions/types";
import {
	Section,
	SectionContent,
	SectionFields,
	SectionField,
	SectionHeader,
	SectionTitle,
} from "@/components/section";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCallback } from "react";

const TRANSITION_TYPES: { value: TransitionType; label: string }[] = [
	{ value: "dissolve", label: "Dissolve" },
	{ value: "wipe-left", label: "Wipe Left" },
	{ value: "wipe-right", label: "Wipe Right" },
	{ value: "wipe-up", label: "Wipe Up" },
	{ value: "wipe-down", label: "Wipe Down" },
	{ value: "slide-left", label: "Slide Left" },
	{ value: "slide-right", label: "Slide Right" },
	{ value: "zoom-in", label: "Zoom In" },
	{ value: "zoom-out", label: "Zoom Out" },
	{ value: "fade-black", label: "Fade to Black" },
	{ value: "dip-white", label: "Dip to White" },
];

export function TransitionsTab({
	element,
	trackId,
}: {
	element: VideoElement;
	trackId: string;
}) {
	const editor = useEditor();

	const updateTransitionIn = useCallback(
		(patch: Partial<Transition>) => {
			const current = element.transitionIn ?? { type: "dissolve" as TransitionType, duration: 0.5 };
			const updated: Transition = { ...current, ...patch };
			editor.timeline.updateElements({
				updates: [
					{
						trackId,
						elementId: element.id,
						patch: { transitionIn: updated },
					},
				],
			});
		},
		[editor, trackId, element.id, element.transitionIn],
	);

	const updateTransitionOut = useCallback(
		(patch: Partial<Transition>) => {
			const current = element.transitionOut ?? { type: "dissolve" as TransitionType, duration: 0.5 };
			const updated: Transition = { ...current, ...patch };
			editor.timeline.updateElements({
				updates: [
					{
						trackId,
						elementId: element.id,
						patch: { transitionOut: updated },
					},
				],
			});
		},
		[editor, trackId, element.id, element.transitionOut],
	);

	const clearTransitionIn = useCallback(() => {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					patch: { transitionIn: undefined },
				},
			],
		});
	}, [editor, trackId, element.id]);

	const clearTransitionOut = useCallback(() => {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					patch: { transitionOut: undefined },
				},
			],
		});
	}, [editor, trackId, element.id]);

	return (
		<>
			<Section collapsible sectionKey={`${element.id}:transition-in`}>
				<SectionHeader>
					<SectionTitle>In Transition</SectionTitle>
				</SectionHeader>
				<SectionContent>
					<TransitionControls
						transition={element.transitionIn}
						onUpdateType={(type) => updateTransitionIn({ type })}
						onUpdateDuration={(duration) => updateTransitionIn({ duration })}
						onClear={clearTransitionIn}
					/>
				</SectionContent>
			</Section>
			<Section collapsible sectionKey={`${element.id}:transition-out`}>
				<SectionHeader>
					<SectionTitle>Out Transition</SectionTitle>
				</SectionHeader>
				<SectionContent>
					<TransitionControls
						transition={element.transitionOut}
						onUpdateType={(type) => updateTransitionOut({ type })}
						onUpdateDuration={(duration) => updateTransitionOut({ duration })}
						onClear={clearTransitionOut}
					/>
				</SectionContent>
			</Section>
		</>
	);
}

function TransitionControls({
	transition,
	onUpdateType,
	onUpdateDuration,
	onClear,
}: {
	transition: Transition | undefined;
	onUpdateType: (type: TransitionType) => void;
	onUpdateDuration: (duration: number) => void;
	onClear: () => void;
}) {
	const currentType = transition?.type ?? "dissolve";
	const currentDuration = transition?.duration ?? 0.5;
	const isActive = transition !== undefined;

	return (
		<SectionFields>
			<SectionField label="Type">
				<Select
					value={currentType}
					onValueChange={(v) => onUpdateType(v as TransitionType)}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select transition" />
					</SelectTrigger>
					<SelectContent>
						{TRANSITION_TYPES.map((t) => (
							<SelectItem key={t.value} value={t.value}>
								{t.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</SectionField>
			<SectionField label={`Duration: ${currentDuration.toFixed(1)}s`}>
				<Slider
					min={0.1}
					max={2.0}
					step={0.1}
					value={[currentDuration]}
					onValueChange={([v]) => onUpdateDuration(v)}
				/>
			</SectionField>
			{isActive && (
				<button
					type="button"
					className="text-muted-foreground hover:text-foreground text-xs transition-colors"
					onClick={onClear}
				>
					Remove transition
				</button>
			)}
		</SectionFields>
	);
}
