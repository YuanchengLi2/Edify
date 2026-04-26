# Text And Keyframes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fuller CapCut-style text inspector and make keyframes visible and usable for all supported animated clip types.

**Architecture:** Extend the existing right-side properties system instead of creating a parallel editor. Keep timeline animation primitives and keyframe storage unchanged, but expose them through a dedicated properties tab and richer text controls.

**Tech Stack:** Next.js, React, Zustand, existing EditorCore managers, existing animation hooks, shadcn UI components

---

### Task 1: Extend Text Inspector

**Files:**
- Modify: `apps/web/src/components/editor/panels/properties/tabs/text-tab.tsx`
- Read: `apps/web/src/lib/timeline/defaults.ts`
- Read: `apps/web/src/lib/text/*`

- [ ] Add richer typography and styling controls using existing text element fields and animation-aware property hooks.
- [ ] Add stroke controls, color controls, background controls, and bubble preset controls with minimal schema changes.
- [ ] Add preset-based text animations using existing animation data structures.

### Task 2: Expose Keyframes Properly

**Files:**
- Modify: `apps/web/src/components/editor/panels/properties/registry.tsx`
- Modify: `apps/web/src/components/editor/panels/properties/tabs/keyframes-tab.tsx`
- Modify: `apps/web/src/components/editor/panels/properties/stores/properties-store.ts`
- Read: `apps/web/src/components/editor/panels/timeline/timeline-element.tsx`

- [ ] Make keyframes tab visible for every supported animated clip type.
- [ ] Add explicit actions to expand/focus timeline keyframes for the selected element.
- [ ] Ensure text clips default to the Text tab while keyframes remain one click away.

### Task 3: Verify Right-Panel Selection Behavior

**Files:**
- Modify: `apps/web/src/components/editor/panels/properties/index.tsx`
- Modify: `apps/web/src/components/editor/panels/properties/stores/properties-store.ts`

- [ ] Keep text selection opening the right panel directly to `text`.
- [ ] Keep other clips opening their primary editing tab while preserving manual tab switches.

### Task 4: Verify And Run

**Files:**
- Modify as needed based on typecheck output

- [ ] Run `bun run tsc --noEmit` from `apps/web`
- [ ] Restart `bun dev:web`
- [ ] Manually verify text selection, text styling, preset animations, and keyframes entry points
