# Caption Timing, Global Masks, And Hybrid Inspector Design

## Goal

Improve generated captions so they follow speech more naturally, replace the current caption template experience with a smaller, cleaner set of YouTube Shorts style popup templates, add global timeline mask overlays, and redesign the right panel into a hybrid inspector.

## Problems

- Generated captions feel mechanically chunked instead of following pauses and phrase boundaries.
- Current template previews are too abstract and do not show a realistic sentence-level result.
- Caption controls in the right panel feel cramped because template selection and detailed styling are competing for space.
- The current template set is too broad and not focused enough on clean popup social-video captions.
- Masks are currently treated as per-element controls instead of first-class timeline items.
- The preview and right-panel controls are too crowded and do not separate caption, mask, and selection editing cleanly.

## Scope

In scope:

- Improve caption chunk generation so transcript output respects pauses, silence, punctuation, and phrase boundaries better.
- Keep one transcription model as the default path for generation.
- Replace the current broad preset set with a tighter library of clean popup caption templates.
- Move template selection into the right panel for caption text elements.
- Upgrade template hover previews so they play a short sentence/transcript sample in the actual template style.
- Add full mask-as-bars timeline work by turning masks into global overlay items.
- Redesign the right panel with a hybrid organization model and broader cleanup beyond caption controls.

Out of scope:

- Broad preview panel redesign beyond caption-related inspector cleanup.
- A full manual subtitle editor redesign.

## Current Context

- `apps/web/src/components/editor/panels/assets/views/captions.tsx` handles transcript generation and import.
- `apps/web/src/lib/transcription/caption.ts` currently builds caption chunks from word groups or segment groups.
- `apps/web/src/lib/subtitles/insert.ts` inserts generated captions as text elements on a text track.
- `apps/web/src/components/editor/panels/properties/tabs/text-tab.tsx` already has a caption-specific right-panel mode with `Templates` and `Styling` tabs.
- Current masks are still treated as element-attached editing concerns rather than timeline-level overlays.

## Proposed Solution

### 1. Speech-Aware Caption Chunking

Update caption generation to prefer transcript accuracy over uniform chunk size.

The chunking rules should:

- Start from word timing when available.
- Break on meaningful silence gaps.
- Break on punctuation that implies a phrase boundary.
- Prevent captions from growing too long in duration or word count.
- Avoid merging across clearly separate speech bursts.
- Preserve per-word timing inside each caption chunk for popup and active-word styling.

Rule priority, highest to lowest:

1. Hard duration and hard word-count caps
2. Strong silence-gap boundaries
3. Sentence-ending punctuation boundaries
4. Soft phrase punctuation boundaries
5. Readability balancing for very short chunks

Fallback behavior:

- If word timings are unavailable, continue using segment-based chunking.
- Segment-based chunking should still become more phrase-aware by using punctuation and duration-based limits.

Required thresholds for first implementation:

- Strong silence gap: split when adjacent words are separated by `>= 0.45s`
- Soft silence gap: prefer split when adjacent words are separated by `>= 0.25s`
- Sentence-ending punctuation: `.`, `?`, `!` always permit a split
- Soft phrase punctuation: `,`, `;`, `:` prefer a split if the chunk already has at least 3 words
- Hard max words per caption: `6`
- Soft target words per caption: `3-5`
- Hard max caption duration: `2.4s`
- Soft max caption duration: `1.8s`
- Minimum useful caption duration: `0.7s`, unless a short spoken burst ends sooner

Handling short chunks:

- If a candidate chunk is shorter than `0.7s` and the next word begins within `0.18s`, merge forward unless doing so violates a hard limit.
- If a candidate chunk is shorter than `0.7s` and the previous chunk ended within `0.18s`, merge backward unless doing so violates a hard limit.
- If neither merge is valid because adjacent speech is separated by a stronger boundary, allow the short chunk instead of extending its end time artificially.
- Do not create overlap by stretching a caption past the next phrase start in this pass.

Conflict handling:

- Never exceed hard max words or hard max duration just to preserve a phrase.
- If a silence gap and punctuation both suggest a split, split once at that boundary.
- If a chunk would become 1 very short word due to a soft boundary, merge forward unless doing so would violate a hard limit.

Soft-boundary tie-break order:

1. Prefer the latest valid boundary that keeps the chunk inside the soft target word range.
2. If multiple valid boundaries satisfy that, prefer sentence-ending punctuation over silence, and silence over soft punctuation.
3. If still tied, prefer the boundary closest to the soft max duration without exceeding it.
4. If no soft boundary produces a valid result, fall back to the earliest boundary required by a hard limit.

### 2. Single Model Path

Use one default transcription model path for now instead of treating model choice as part of the main UX.

Rationale:

- The user wants reliable captioning rather than model-management UI.
- Multiple model options add noise to the generation workflow.
- Model-specific tuning can be revisited later if necessary.

Implementation direction:

- Keep a single model in the transcription flow.
- Prefer the most reliable backend initialization path over automatic hardware selection if that avoids hangs.

Concrete decision for this pass:

- Keep only `whisper-tiny` as the active generation model.
- Use the reliable non-auto initialization path already introduced for the worker.
- Remove or ignore model-selection UI from the main caption-generation flow.
- If initialization fails, show an actionable error in the captions UI instead of falling back to a second model in this pass.

### 3. Shorts-Style Template Library

Replace the current broad preset set with a tighter, curated set focused on social-video popup captions.

Initial preset families:

- Bold Pop: bold outlined text with popup emphasis.
- Accent Word: neutral sentence with one active word highlighted.
- All Caps Shorts: compact uppercase social-caption style.
- Fast Punch: tighter timing and sharper popup motion.
- Soft Variant: calmer version of popup styling for less aggressive videos.

Required preset set for this pass:

- `Pop White`
- `Pop Yellow`
- `Accent Cyan`
- `Accent Lime`
- `All Caps White`
- `Fast Punch Orange`
- `Clean Mint`
- `Soft White`
- `Soft Color`

Concrete preset values for first implementation:

- `Pop White`
  - font family: `Anton`
  - font weight: `bold`
  - color: `#FFFFFF`
  - highlight color: `#FFFFFF`
  - stroke color: `#111111`
  - stroke width: `2.5`
  - letter spacing: `0`
  - line height: `1.0`
  - text transform: normal case
  - word animation: `popup`
  - word animation duration: `0.18s`

- `Pop Yellow`
  - font family: `Anton`
  - font weight: `bold`
  - color: `#F8E71C`
  - highlight color: `#F8E71C`
  - stroke color: `#111111`
  - stroke width: `2.5`
  - letter spacing: `0`
  - line height: `1.0`
  - text transform: normal case
  - word animation: `popup`
  - word animation duration: `0.18s`

- `Accent Cyan`
  - font family: `Anton`
  - font weight: `bold`
  - base color: `#FFFFFF`
  - highlight color: `#00E5FF`
  - stroke color: `#111111`
  - stroke width: `2.5`
  - letter spacing: `0`
  - line height: `1.0`
  - highlight mode: active word only
  - word animation: `popup`
  - word animation duration: `0.18s`

- `Accent Lime`
  - font family: `Anton`
  - font weight: `bold`
  - base color: `#FFFFFF`
  - highlight color: `#B7FF00`
  - stroke color: `#111111`
  - stroke width: `2.5`
  - letter spacing: `0`
  - line height: `1.0`
  - highlight mode: active word only
  - word animation: `popup`
  - word animation duration: `0.18s`

- `All Caps White`
  - font family: `Anton`
  - font weight: `bold`
  - color: `#FFFFFF`
  - highlight color: `#FFFFFF`
  - stroke color: `#111111`
  - stroke width: `2.5`
  - letter spacing: `0.4`
  - line height: `0.96`
  - text transform: uppercase
  - word animation: `popup`
  - word animation duration: `0.16s`

- `Fast Punch Orange`
  - font family: `Anton`
  - font weight: `bold`
  - base color: `#FFFFFF`
  - highlight color: `#FF8A00`
  - stroke color: `#111111`
  - stroke width: `2.5`
  - letter spacing: `0.2`
  - line height: `0.98`
  - highlight mode: active word only
  - word animation: `pop`
  - word animation duration: `0.14s`

- `Soft White`
  - font family: `Poppins`
  - font weight: `bold`
  - color: `#FFFFFF`
  - highlight color: `#FFFFFF`
  - stroke color: `#111111`
  - stroke width: `1.5`
  - letter spacing: `0`
  - line height: `1.05`
  - text transform: normal case
  - word animation: `fade`
  - word animation duration: `0.20s`

- `Clean Mint`
  - font family: `Poppins`
  - font weight: `bold`
  - base color: `#FFFFFF`
  - highlight color: `#5CF2C5`
  - stroke color: `#111111`
  - stroke width: `1.5`
  - letter spacing: `0.05`
  - line height: `1.02`
  - highlight mode: active word only
  - word animation: `slide-up`
  - word animation duration: `0.17s`

- `Soft Color`
  - font family: `Poppins`
  - font weight: `bold`
  - base color: `#FFFFFF`
  - highlight color: `#7CFFB2`
  - stroke color: `#111111`
  - stroke width: `1.5`
  - letter spacing: `0`
  - line height: `1.05`
  - highlight mode: active word only
  - word animation: `fade`
  - word animation duration: `0.20s`

Style constraints:

- Favor no background by default.
- Use strong outlines and bright accent colors.
- Avoid heavy boxed subtitle looks unless intentionally added later.
- Keep fonts and spacing aligned with short-form social video conventions.

Required style rules:

- No background-enabled presets in the default library for this pass.
- Every preset must use stroke-based readability.
- Every preset family must define a distinct word animation or highlight treatment.
- Accent presets highlight only the active word, not the entire line.
- Soft presets use reduced scale animation and lower contrast accenting than Pop/Fast presets.

Preset property requirements:

- font family
- font weight
- base color
- highlight color
- stroke color
- stroke width
- letter spacing
- line height
- text transform choice where applicable
- word animation
- word animation duration

Canonical preset schema for this pass:

- `baseColor`
- `highlightColor`
- `highlightMode`
- `fontFamily`
- `fontWeight`
- `strokeColor`
- `strokeWidth`
- `letterSpacing`
- `lineHeight`
- `textTransform`
- `wordAnimation`
- `wordAnimationDuration`

Normalization rule:

- Any existing use of plain `color` should be normalized into `baseColor` during implementation.
- Rendering and inspector code should read from the normalized schema only.

Animation mapping for this pass:

- `popup`: use the existing strongest scale-up active-word behavior already supported by caption rendering.
- `pop`: use the current lighter/faster scale-up behavior if available; otherwise alias to `popup` with shorter duration.
- `fade`: use the current opacity-based word reveal behavior; if unavailable, use no scale and opacity-only transitions.
- `slide-up`: use the current upward-offset reveal behavior; if unavailable, alias to `fade`.

Soft preset motion rule:

- Soft presets use the same renderer-supported animation names above, but with smaller scale change and longer duration than Pop/Fast presets.

### 4. Sentence-Based Hover Previews

Template cards should preview a realistic sample sentence rather than a single word or abstract motion demo.

Behavior:

- On hover, play through a short transcript sample.
- Animate the sample according to the preset's word animation and highlight behavior.
- Show realistic word grouping so users can judge readability and pacing.
- Reuse one or a few internal sample transcripts to keep the gallery consistent.

Concrete behavior:

- Each card uses one sample sentence preview lasting about `1.8-2.2s`.
- Preview starts on pointer hover and restarts from the beginning on each new hover.
- Preview stops and resets when hover ends.
- Keyboard focus should trigger the same preview behavior for accessibility.
- Use `2` internal sample transcripts total: one punchier uppercase sample and one natural sentence sample.
- Templates choose between those samples based on style fit, but the sample set stays fixed.

The point of the preview is to answer: `What would an actual caption line feel like in this style?`

### 5. Right Panel Layout Cleanup

Move template selection into the right-side caption inspector when a caption text element is selected.

Inspector structure:

- Templates tab: preset gallery and apply behavior.
- Styling tab: detailed controls for colors, font, emphasis, and fine tuning.

Visibility rules:

- Show caption-specific `Templates` and `Styling` tabs only when the selected text element has `captionStyle` metadata.
- Plain text elements keep the existing text inspector flow.
- If multiple caption text elements are selected, show the caption inspector and allow bulk application.
- If multiple caption text elements are selected across different tracks, disable `Apply to all` for this pass and allow selected-only application.
- If mixed caption and non-caption text is selected, fall back to the existing generic text behavior for this pass.

Old caption detection rule:

- Treat a text element as a caption element if it has `captionStyle` metadata or if it was inserted on a generated caption track and still carries word-timing subtitle data.
- If older caption elements have partial caption metadata, surface them in the caption inspector as `Custom` and preserve any readable fields until the user applies a new preset.

Layout priority:

- Template choice should be the first action.
- Advanced controls should stay available but secondary.
- The inspector should feel lighter and less crammed by leading with presets instead of many low-level controls at once.

### 6. Global Mask Timeline Overlays

Masks become first-class overlay timeline items instead of clip-attached masks for this new workflow.

Behavior:

- A mask item exists on its own timeline track or lane, similar to text overlays.
- A mask item affects the visual result of everything below it during its active range.
- A mask item can be moved and resized on the timeline like other overlay items.
- A mask item owns its own mask parameters and animation state.
- Static masks and animated mask properties both belong to that mask item.

Mask compositing scope:

- A mask overlay applies to lower visual tracks only.
- It does not affect tracks above the mask overlay.
- Multiple mask overlays stack in timeline order using the existing visual layering rules where possible.

Editing:

- Selecting a mask overlay opens a mask-specific inspector in the right panel.
- Mask overlays should support the existing shape types where feasible.
- Existing per-element mask editing should not be expanded further in this pass; the new primary direction is timeline overlays.

### 7. Hybrid Right-Panel Redesign

Use a hybrid inspector model: stable top-level sections with strongly selection-adaptive content.

Top-level organization for this pass:

- `Edit`
- `Style`
- `Animate`
- `Preview`

Selection behavior:

- Caption text selection: template-first caption inspector inside `Style`, timing-safe editing inside `Edit`.
- Mask overlay selection: mask controls inside `Edit` and visual tuning inside `Style`.
- Plain text selection: existing text editing flow, but simplified where possible.
- Clip/media selection: current clip-oriented controls remain, but should not crowd caption/mask tools.
- No selection: show lighter contextual guidance or project-level controls instead of a packed control stack.

Preview-panel cleanup goals:

- Reduce duplicated preview-related controls between the preview surface and inspector.
- Keep frequently used preview toggles accessible, but avoid letting preview controls dominate selection editing.
- Make caption and mask editing feel primary when those items are selected.

Template apply rules:

- The template picker in the right panel is the primary place to apply presets.
- Default behavior is apply to all generated caption elements in the caption track when `Apply to all` is enabled.
- If `Apply to all` is disabled, apply only to the currently selected caption element(s).
- Existing generated captions should keep working; applying a new preset updates their stored caption-style metadata and element style values without regenerating transcript timing.

Track targeting rules:

- `Apply to all` targets the track containing the currently selected caption element.
- Only elements on that same track with `captionStyle` metadata are included.
- Manual plain text elements on the same track are excluded if they do not have `captionStyle` metadata.
- Imported subtitle captions that were inserted as caption text elements count as caption elements if they carry `captionStyle` metadata.
- If multiple caption tracks exist, no cross-track update occurs in this pass.

Inspector rules for masks:

- Mask overlay items use the hybrid inspector, not the caption text inspector.
- Mask overlay controls should prioritize shape, bounds, feather/softness, invert/mode where applicable, and animation controls.
- Mask overlay editing must remain selection-specific and must not look like generic clip controls.

## Detailed Behavior

### Chunking Heuristics

Candidate inputs:

- Word timings from transcription output.
- Segment text and segment start/end times.

Segment-only fallback rules:

- Split segment text by sentence-ending punctuation first.
- Within each sentence fragment, split by soft phrase punctuation if the fragment exceeds 6 words.
- If a fragment still exceeds 6 words, split greedily into 3-5 word groups.
- Distribute segment duration proportionally by word count across resulting chunks.
- Apply the same hard max duration rule by further splitting long segment-derived chunks when necessary.

### Global Mask Overlay Model

Minimum first-pass data expectations:

- mask overlay id
- start time
- duration
- transform or placement data needed for preview rendering
- mask type
- mask params
- animations for mask properties where supported

Migration expectation:

- Existing element-attached masks can remain for backward compatibility in old content, but new mask-bar editing work should target the global overlay model.
- This pass does not need to migrate every old per-element mask automatically into a global mask overlay.

Suggested chunk boundaries:

- Silence gap above threshold between adjacent words.
- Punctuation at the end of a word or phrase.
- Word-count ceiling for readability.
- Duration ceiling for on-screen persistence.

Suggested anti-boundaries:

- Do not split in the middle of a very short phrase unless duration/readability forces it.
- Do not keep combining words after a strong silence or sentence-ending punctuation.

Word-timing preservation requirements:

- Every generated caption chunk with word-timed input must store per-word offsets relative to that chunk start.
- Relative word timings must stay non-negative and monotonic.
- Segment-only fallback must continue producing caption chunks even when `words` is empty or missing.

### Caption Template Data Model

The existing caption preset system can stay, but the preset inventory should be rewritten around the new library.

Likely updates:

- Replace or trim `CAPTION_PRESETS`.
- Keep category support, but use fewer more meaningful categories.
- Ensure preset metadata supports realistic hover previews.

Category structure for this pass:

- `Pop`
- `Accent`
- `Clean`
- `Soft`

Migration rule:

- Existing broader caption presets can be removed from the visible gallery for this pass rather than preserved one-for-one.
- Do not break existing saved caption elements that reference an old preset id; they should keep rendering using stored style fields even if the old preset is no longer exposed in the gallery.

Selection and update behavior for old captions:

- If an older caption element is selected and its preset id is no longer present, show it as `Custom` in the inspector.
- If that older element has enough stored style fields to render, preserve them until the user selects a new preset.
- Once a new preset is applied, rewrite the caption style metadata to the new preset shape used by this pass.

### Preview Sample Model

Introduce a small internal preview transcript model for template cards, for example:

- sentence text
- grouped words
- per-word timing offsets

This preview model should be local to the gallery or caption preset preview system and should not affect generated project data.

Minimum shape:

- full sentence text
- ordered word list
- grouped word ranges for display beats
- relative timing offsets for each word/group

## Risks

- More aggressive chunking changes may improve pauses but create too many short captions if thresholds are not tuned carefully.
- Preset simplification may remove styles some users liked, so changes should focus on replacing weak presets with stronger social-video defaults rather than just deleting variety.
- Moving template selection in the inspector must not make it harder to bulk-apply styles across generated caption elements.
- Global mask overlays touch timeline, rendering, and inspector behavior at once, so regression risk is higher than the caption-only work.
- The hybrid inspector can become inconsistent if section ownership is not kept clear across caption, mask, and clip selection states.

## Verification

- Generate captions for speech with short pauses and longer silence.
- Confirm chunk boundaries follow phrasing better than current fixed grouping.
- Confirm generated captions still insert as editable text elements with word timing metadata.
- Confirm right-panel template selection works for caption text elements.
- Confirm each template card plays a realistic sentence-style hover preview.
- Confirm applying a preset updates caption appearance consistently.
- Confirm detailed styling remains available without making the panel feel crowded.
- Confirm mask overlays can be inserted, moved, resized, and selected on the timeline.
- Confirm mask overlays affect lower visual tracks during their active range.
- Confirm selecting a mask overlay opens the correct hybrid inspector state.
- Confirm preview controls remain usable without crowding caption and mask editing.

Regression checks:

- Confirm no-word-timing transcripts still generate captions.
- Confirm segment-only fallback still respects punctuation and duration limits.
- Confirm generated caption word timing metadata remains valid for popup/highlight rendering.
- Confirm old generated captions remain editable and render correctly after preset-library changes.
- Confirm `Apply to all` updates all generated caption elements without changing their transcript timing.
- Confirm selected-only template application does not affect sibling caption elements.
- Confirm newly generated captions still support active-word highlighting and popup timing after the new chunking logic changes chunk boundaries and word offsets.

Fixture-based verification:

- Add transcript fixtures with expected chunk outputs for:
  - punctuation-heavy speech
  - short silence gaps
  - long silence gaps
  - short-chunk merge-forward and merge-backward cases
  - word-timed input
  - segment-only input with no words
- Add apply-scope verification for:
  - selected-only update
  - same-track `Apply to all`
  - multi-track no-cross-track update
- Add mask-overlay verification for:
  - overlay affects lower tracks only
  - overlay does not affect higher tracks
  - timeline move/resize updates rendered mask range
  - inspector edits update the selected mask overlay only
- Add saved-project regression coverage for:
  - existing caption elements with old preset ids
  - existing caption elements missing some newer style fields
- Add UI verification for:
  - keyboard-focus preview start and reset on blur
  - actionable initialization error message when `whisper-tiny` fails to initialize
  - `Custom` inspector state for old preset ids
  - hybrid inspector section switching across caption, mask, clip, and no-selection states

## Implementation Notes

- Keep edits minimal and focused on the existing caption flow.
- Reuse the current caption preset plumbing where possible.
- Prefer improving current chunking utilities over introducing a parallel caption-generation pipeline.

## Open Follow-Up

- If users later want multiple transcription models again, that should be reintroduced as an advanced option rather than the primary captions flow.
