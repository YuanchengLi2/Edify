# Mask System And Product Direction Design

## Summary

Edify should position itself as a fast AI-native video editor for creators who want CapCut speed with more control. The immediate implementation focus is not broad AI automation; it is a stronger manual masking system that feels desktop-native, fast, and precise. AI remains a future collaborator layer on top of a real editor, not a replacement for direct manipulation.

The first major editing system to bring to that standard is masks. The current mask flow is asset-panel driven and largely preset-based. The target system is a desktop-first mask workflow with multiple masks per element, a stack in the properties panel, and direct on-canvas editing for the active mask.

In V1, a mask is a clip-local matte operation that affects the clip's visible pixels. It is not a standalone shape layer. Canvas outlines and handles are editor chrome only. Existing fill and stroke controls are treated as secondary visual styling attached to the mask system only if they remain cheap and stable; they are not the core semantic model of masks.

## Product Direction

### Positioning

Primary positioning:

`A fast AI-native video editor for creators who want CapCut speed with more control.`

This is more specific and credible than "for anyone," while still leaving room to grow.

### Primary Users

Best initial users:

- short-form creators
- solo marketers
- freelancers making social edits

Lower-priority users for the first version:

- film/post-production professionals
- large collaboration-heavy teams
- users with no editing intent who only want generation

### Product Principles

- Direct manipulation must feel good before AI is layered on top.
- AI should operate as a copilot that edits the same timeline and canvas the user can inspect and change.
- Small local AI actions should apply directly with undo.
- Broad or destructive AI actions should preview before apply.
- The product should be simple at first glance, but capable once the user goes deeper.

## Scope Decision

### What To Build Now

Build TikTok/CapCut-style manual mask tools first.

This means the near-term mask system should prioritize:

- mask creation from presets
- dragging, resizing, and rotating on canvas
- feather and expand controls
- invert support
- fast selection and deletion
- multiple masks per clip
- stack-based mask management

The must-win V1 behaviors are:

- add and select masks quickly
- edit the active mask directly on canvas
- manage more than one mask on a clip without confusion
- make mask edits affect preview immediately
- keep undo/redo reliable

### What Not To Build Yet

Do not make AI masking the main workflow yet.

Defer:

- motion/object tracking
- person/object auto cutout
- prompt-based mask editing
- broad generative video editing workflows centered on masks
- advanced boolean mask operations unless existing architecture makes them cheap

## Mask UX Design

### Core Interaction Model

Masks should become editable canvas objects associated with the selected clip.

Behavior:

- Adding a mask creates a new mask on the selected element and selects it immediately.
- The selected mask is edited directly on the preview canvas.
- The active mask shows a visible selection outline, center point, and transform handles.
- Users can drag, resize, and rotate the active mask directly.
- Canvas interactions only affect the active mask.
- When selecting a clip, restore its last active mask if it still exists; otherwise select the first visible mask; otherwise leave no active mask selected.

This should feel like a real desktop editing system, not a static preset picker.

### Multiple Masks Per Element

The saved timeline model should support multiple masks per element.

Editor behavior should distinguish between:

- persisted mask data on the element
- transient editor UI state for the currently active mask

The active mask should be stored in editor UI state, not embedded in saved mask data, so playback/rendering remains data-driven and the interaction model stays flexible.

### Mask Stack

The properties-side mask tab should become a stack-based editor.

Each selected clip should show a compact mask stack with:

- selection state
- visibility toggle
- duplicate
- delete

Selecting a row in the stack selects that mask on canvas.

The UI must make it obvious which mask is active and which masks are hidden.

For V1, reorder is deferred unless stack ordering is proven to change rendered output in a stable and understandable way. Multiple masks are supported in V1, but explicit stack reordering is a follow-up feature once combine semantics are ready.

### Add Vs Edit Split

The masks asset panel and the properties mask tab should have separate responsibilities.

Asset-side masks browser:

- browse/search mask presets
- click to add to selected element
- drag to apply to selected element
- disabled state when no maskable element is selected

Properties-side mask tab:

- edit the selected mask stack
- manage selection and visibility
- control geometry and appearance for the active mask

This keeps the asset panel focused on insertion and the properties panel focused on editing.

## Panel Design

### Masks Browser

The masks browser should visually align with the other asset panels but behave like a mask source rather than a true timeline asset source.

Requirements:

- searchable preset list
- compact categories
- click-to-add
- drag-to-apply
- empty/disabled state messaging when no valid element is selected

Unlike stickers or text, dropping a mask should not create a new timeline element. It should attach a new mask to the selected element.

### Properties Mask Tab

The mask tab should become the main editing surface for mask data.

Recommended order:

1. mask stack
2. add mask action
3. active mask type
4. transform controls
5. feather / expand
6. invert
7. visibility and duplicate
8. destructive actions

The tab must scale cleanly from one mask to many masks without becoming confusing.

V1.1 if implementation remains stable:

- fill / stroke
- rename controls
- reorder controls

## V1 Feature Set

### Mask Presets

V1 should support these manual mask types:

- rectangle
- ellipse
- rounded rect
- split
- heart
- star

If the currently implemented additional shapes remain cheap and stable, they can stay behind the same system, but they are not required for V1 success.

### Editing Features

V1 should support:

- add mask
- select active mask
- drag
- scale
- rotate
- feather
- expand
- invert
- visibility toggle
- delete

V1.1 if implementation remains clean:

- fill color
- fill opacity
- stroke color
- stroke width
- rename
- reorder

### Deferred Features

Defer from V1 unless implementation is nearly free:

- subject tracking
- auto cutout
- promptable mask changes
- boolean combine/subtract operations between masks
- dedicated mask keyframe/timeline UX beyond existing animation plumbing

## Technical Design

### Data Model

Continue using `masks?: Mask[]` on maskable visual elements.

Requirements:

- preserve mask order in element data
- preserve stable mask ids for selection and commands
- avoid storing editor-only active-selection state in project data

In V1, mask visibility is persisted in mask data and affects preview and export. There is no separate UI-only hidden-mask state.

### Editor State

Introduce or expand editor UI state to track:

- active mask id for the selected element
- drag/edit interaction state for the active mask

### Renderer

Renderer behavior should match saved mask order.

Requirements:

- composite masks in element mask array order
- render fill and stroke consistently for each mask
- keep rendering resilient when older mask data lacks newer params

For V1, multiple masks combine by intersecting clip visibility as each mask is applied in array order. Because intersection is commutative for the intended V1 behavior, reorder is not exposed as a user-facing control until combine modes or other ordering-sensitive semantics exist.

### Commands

Mask operations should be promoted to first-class timeline commands where possible.

Needed operations:

- add mask
- update active mask params
- duplicate mask
- remove mask
- toggle visibility

V1.1 operations if needed:

- rename mask
- reorder masks

This keeps undo/redo consistent and aligns with future AI-assisted editing.

### Preview Interaction

Preview interaction should be extended so masks behave like editable entities on the selected clip.

Needed capabilities:

- hit-testing for active mask handles
- translating pointer movement into mask param updates
- rotation handling
- resize logic by shape type
- clear selection feedback

The first version should optimize for desktop precision, not touch-first simplicity.

## AI Direction After Manual Masks

Edify should eventually behave like an editor where the user edits normally while AI can perform meaningful edits in the same environment.

### AI Operating Model

- small, local changes apply directly with undo
- broad, multi-element changes preview first
- AI changes should materialize as normal editable timeline/canvas changes
- users should be able to inspect, tweak, or revert every AI operation

### Best First AI Features Later

Recommended order after the manual mask system is strong:

1. caption rewrite and style variations
2. silence/filler removal
3. auto reframing for aspect ratios
4. highlight extraction
5. b-roll suggestions
6. promptable animation/effect tweaks

Mask-specific AI should come later:

- subject tracking
- auto cutout
- prompt edits like "soften this edge" or "follow the left speaker"

## Error Handling And UX States

### No Selection

If no maskable element is selected:

- masks browser should be disabled but still informative
- properties mask tab should clearly explain that masks require a selected video, image, sticker, or graphic element

### Invalid Active Mask

If the active mask is deleted or the selected element changes:

- select the next valid mask when possible
- otherwise clear active mask state cleanly

### Older Data

If existing projects have masks without newer fields such as fill params or visibility flags:

- renderer and UI should fall back safely
- commands should normalize missing fields when masks are edited

## Testing Strategy

### Unit Tests

Add or expand tests for:

- duplicate/remove behavior
- active mask fallback behavior
- param update math for drag/resize/rotate interactions
- renderer ordering behavior where practical

If V1.1 reorder ships, add stack reorder tests there.

### Interaction Tests

Add focused tests for:

- adding a mask selects it
- selecting stack rows updates active canvas mask
- deleting active mask selects a sensible fallback
- visibility persistence affects preview/export

### Manual Verification

Verify in the editor:

- create multiple masks on one clip
- toggle visibility
- duplicate masks
- drag/resize/rotate active mask
- change feather/expand
- switch between clips and preserve valid selection behavior

If V1.1 styling ships, also verify fill/stroke controls.

## Implementation Phases

### Phase 1

- align masks browser with add/apply behavior
- make mask tab stack-aware
- add active mask editor state

### Phase 2

- implement on-canvas active mask selection and transform editing
- add duplicate, delete, visibility

### Phase 3

- harden renderer behavior and persisted visibility
- add tests and verification coverage

### Phase 3.1

- add fill/stroke styling if implementation remains stable
- add rename and reorder only if ordering semantics are intentionally expanded beyond simple intersection

### Phase 4

- revisit AI copilot features after the manual system is strong

## Recommendation

The right next build is a desktop-first, multi-mask editing system with a sidebar mask stack and direct on-canvas manipulation. That gives Edify a credible editing foundation and prepares the editor for a later AI copilot layer on top of an editing workflow users already trust.
