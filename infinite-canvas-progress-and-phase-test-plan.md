# Infinite Canvas Assignment — Progress & Phase Test Plan

**Document status:** Current frozen baseline  
**Last updated:** September 5, 2026  
**Purpose:** Record what has been implemented, validated, frozen, deferred, and the current acceptance/test plan.

---

# 1. Status Model

- **Complete** — implementation and required validation completed.
- **Frozen** — intentionally preserved as the baseline; do not modify while using it for comparison.
- **In Progress** — currently being implemented.
- **Pending Validation** — implementation exists but required runtime/manual evidence is incomplete.
- **Planned** — work has not yet started.
- **Deferred** — intentionally postponed.
- **Phase X** — production refactor/rebuild based on the frozen behavioral baseline.

---

# 2. Current Frozen Baseline

The current uploaded implementation is the **frozen working baseline**.

Validated/working areas include:

- Rectangle drawing and rendering
- Rectangle dragging
- Grab-point preservation
- Pan
- Cursor-centered zoom
- Zoom limits
- Minimap shape representation
- Minimap viewport representation
- Minimap click navigation
- Minimap viewport interaction
- Live minimap updates during pan/zoom
- Whole-canvas minimap bounds
- Committed minimap viewport DOM synchronization
- Pointer-event interaction foundation
- RAF-based transient interaction updates
- Final React commits after transient interactions

**Important:** Temporary diagnostics remain in the current files. Cleanup is deliberately postponed.

---

# 3. Phase 1 — Baseline / Initial Implementation

**Status: Frozen**

Original assignment behavior preserved as the behavioral baseline.

## Included

- Rectangle creation/drawing
- Rectangle rendering
- Rectangle dragging
- Canvas pan
- Zoom
- Minimap
- Toolbar
- Original source structure

---

# 4. Phase X.2 — Pointer / Interaction Foundation

**Status: Complete / Frozen**

## Implemented

- Unified Pointer Events
- Pointer lifecycle: `start()`, `move()`, `end()`, `cancel()`
- Pointer ID and position outside React render state
- Interaction types: idle, drawing, dragging, panning
- Shape interaction migrated to `onPointerDown`
- Canvas interaction migrated to Pointer Events
- Pointer capture/release handling
- Obsolete touch handlers removed

## Validation

- `npm run build` passed
- Drawing passed
- Pan passed
- Drag passed
- Zoom passed
- Zoom + drag passed

---

# 5. Phase 3 — Runtime Drag Optimization

**Status: Implemented / Frozen**

## Implemented

- Temporary drag position outside React state
- `requestAnimationFrame` visual updates
- Direct DOM visual updates for active rectangle
- Final React commit on release
- Pan guarded during active shape drag
- RAF cleanup
- `will-change: transform`
- Drag transition disabled

## Historical Issue

A zoom-dependent drag drift/release-jump issue was later identified in the frozen implementation. It became a dedicated Phase X drag-rewrite target instead of being repeatedly patched in the frozen baseline.

---

# 6. Phase 4 — Viewport / Pan / Zoom Improvements

**Status: Complete / Frozen**

Validated:

- Pan
- Cursor-centered zoom
- Minimum scale
- Maximum scale
- Coordinate conversion
- Viewport interaction

Current limits:

- Minimum: `0.25×`
- Maximum: `4×`

---

# 7. Phase 5 — Performance / Runtime Validation

**Status: Implemented / Pending Final Comprehensive Validation**

## Completed

- Chrome Performance profiling
- React Profiler investigation
- ShapeView memoization identified as an important optimization
- RAF drag architecture
- Investigation of viewport/minimap participation in renders

## Observation

Zoom can generate repeated React commits at approximately frame-sized intervals. This alone does not prove a 60 FPS failure; Chrome Performance remains the authority for runtime/frame behavior.

## Still Required

- Final clean Chrome Performance drag trace
- Final clean Chrome Performance zoom trace
- Final React Profiler validation where DevTools instrumentation is stable
- Comparison with the original profiling baseline

---

# 8. Phase 6 — Minimap / Viewport Integration

**Status: Complete / Frozen**

This phase is now frozen.

## Whole-canvas minimap

Bounds include:

- all shapes
- current viewport
- configured padding

## Live viewport synchronization

During pan/zoom, the viewport rectangle is updated through the transient RAF path without forcing React state updates for every pointer/wheel event.

## Viewport sizing

- Zoom in → viewport rectangle becomes smaller
- Zoom out → viewport rectangle becomes larger

## Settled-state DOM synchronization

A stale-DOM problem was diagnosed with runtime measurements.

One failing case showed approximately:

```text
Expected viewport left: 0
Actual DOM viewport left: -97px
```

while top, width, and height matched.

The fix was to synchronize committed viewport geometry onto the real DOM using `useLayoutEffect` after React commits.

## Frozen architecture

```text
During pan / zoom
    ↓
requestAnimationFrame
    ↓
imperative minimap viewport update
    ↓
live visual update

Interaction commit
    ↓
React committed viewport
    ↓
useLayoutEffect
    ↓
authoritative DOM synchronization
```

This fixed the observed settled minimap viewport displacement.

**Frozen rule:** Do not modify minimap viewport geometry unless a new reproducible regression is demonstrated.

---

# 9. Phase X.1 — Viewport Foundation

**Status: Complete / Frozen**

Created the viewport abstraction:

```text
src/types/viewport.ts
src/utils/viewport.ts
src/hooks/useCanvasViewport.ts
src/hooks/index.ts
```

Provides:

- `Viewport`
- `screenToCanvas`
- `canvasToScreen`
- `zoomAtScreenPoint`
- `useCanvasViewport`
- `panBy`
- `setPosition`
- `setScale`
- `zoomAt`
- `viewportRef`
- transient pan APIs
- transient zoom APIs
- coordinate conversion helpers

---

# 10. Phase X.3 — Drag Rewrite

**Status: Complete / Frozen**

## Goal

Resolve zoom-dependent drag drift and release jump.

## Implemented

- Grab-point preservation
- Drag offset captured on pointer-down
- Pointer converted into canvas coordinates
- Shape position calculated from captured canvas-space offset
- Drag continues when pointer leaves rectangle
- Release without snap/jump
- Pointer capture/release preserved
- No drawing regression

## Validated

- Normal drag
- Center grab
- Edge/corner grab
- Pointer leaving rectangle
- Release outside rectangle
- Zoom out → drag
- Zoom in → drag
- Pan
- Zoom
- Drawing

---

# 11. Phase X.4 — Drawing Rewrite

**Status: Complete / Frozen**

## Implemented

- Dedicated `useCanvasDrawing` hook
- Drawing state moved out of `App.tsx`
- `startDrawing()`
- `updateDrawing()`
- `finishDrawing()`
- `isDrawing()`
- Reactive `drawingShapeId`
- RAF-based transient drawing
- Direct DOM drawing updates
- Single React commit for final geometry
- Tiny-shape cleanup
- Drawing RAF lifecycle moved into the hook
- Duplicate drawing logic removed from `App.tsx`

## Validated

- Immediate drawing start
- Drawing in all directions
- Rapid pointer movement
- Tiny-shape cleanup
- Release outside canvas
- Pan after drawing
- Zoom after drawing
- Drag after drawing

---

# 12. Phase X.5 — Pan Rewrite

**Status: Complete / Frozen**

Acceptance areas:

- Normal pan
- Edge auto-pan
- Interaction priority
- No conflict between pan and shape dragging

Current working viewport/pan behavior is part of the frozen baseline.

---

# 13. Phase X.6 — Zoom Integration

**Status: Complete / Frozen**

Validated:

- Cursor-centered zoom
- Screen ↔ canvas conversion
- Minimum `0.25×`
- Maximum `4×`
- Pan + zoom regression
- Drag after zoom
- Drawing after zoom
- Minimap synchronization after zoom

---

# 14. Phase X.7 — Minimap Cleanup

**Status: Complete / Frozen**

Validated:

- Minimap click-to-center navigation
- Minimap viewport interaction
- Whole-canvas bounds
- Empty-canvas bounds
- Viewport representation
- Shape representation
- Pan + zoom synchronization
- Drawing/dragging regression
- Minimap behavior at zoom limits
- Derived minimap calculations

The committed DOM synchronization fix is included in this frozen baseline.

---

# 15. Deferred Work

## 15.1 Temporary Diagnostics

**Status: Deferred**

Temporary logging is intentionally retained for now:

- App render logs
- Pointer lifecycle logs
- Minimap pan/zoom logs
- Committed minimap frame logs
- DOM geometry logs

These will be removed in a dedicated cleanup phase.

## 15.2 Pointer / Browser Cursor Issue

**Status: Deferred**

An occasional browser pointer/cursor behavior was observed during interaction near/outside the canvas. Diagnostics were added and a later test showed the interaction behaving correctly.

This remains deferred until cleanup/final regression.

## 15.3 Infinite-Canvas Extreme-Scale Usability

**Status: Deferred / Design Decision Pending**

At a very large world size, the minimap viewport rectangle can become very small and difficult to grab.

Current decision:

- Preserve infinite-canvas behavior.
- Do not impose an artificial world-size limit.
- Do not change actual viewport geometry merely to enlarge its hit area.
- If necessary, evaluate a separate invisible interaction hit target.
- Far-away shapes must remain represented in the whole-canvas minimap.

## 15.4 Drawing Beyond Viewport Edge

**Status: Deferred**

Future requirement:

- edge auto-pan while drawing;
- continuous rectangle growth while canvas pans;
- correct canvas-space geometry;
- pointer remains inside browser viewport.

This is an extended infinite-canvas requirement, not a frozen-baseline regression.

## 15.5 Final Cleanup

**Status: Deferred**

Later cleanup will address:

- temporary diagnostics
- obsolete refs
- dead state
- unused imports/variables
- duplicate coordinate calculations
- duplicate handlers
- obsolete implementation paths after migration is proven

---

# 16. Current Frozen Architecture

```text
                    USER INPUT
                        │
                        ▼
              Pointer Interaction
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Drawing        Dragging       Panning
          │             │             │
          ▼             ▼             ▼
        RAF / refs / transient DOM updates
                        │
                        ▼
                  Final React commit
                        │
                        ▼
                Authoritative state
```

Viewport ownership:

```text
useCanvasViewport
       │
       ├── pan
       ├── zoom
       ├── position
       ├── coordinate conversion
       └── viewportRef
```

Minimap ownership:

```text
Minimap
  │
  ├── whole-canvas bounds
  ├── minimap projection
  ├── live transient viewport
  ├── committed DOM synchronization
  └── minimap navigation
```

---

# 17. Phase Test Plan

## Testing Rules

For every future code change:

1. Make one focused change.
2. Run `npm run build`.
3. Run the relevant manual regression tests.
4. Profile only when the phase requires runtime evidence.
5. Do not combine unrelated interaction changes.
6. Record failures and observations before changing implementation again.

---

# 18. Drawing Tests

## Create / Draw Rectangle

### Test

1. Reload.
2. Select rectangle drawing mode.
3. Press an empty canvas location.
4. Move.
5. Release.

### Expected

- Drawing starts immediately.
- Rectangle follows pointer.
- Final rectangle commits on release.
- No delayed start.
- Existing rectangles remain unaffected.

## Drawing Directions

Test all four directions and rapid pointer movement.

## Tiny Shape

Create a very small rectangle.

### Expected

Tiny accidental shapes are removed according to the current implementation.

---

# 19. Drag Tests

## Normal Drag

Drag one of several rectangles for 2–5 seconds.

### Expected

- Rectangle follows pointer.
- Other rectangles remain stable.
- Final position commits on release.
- No release jump.

## Grab-Point Preservation

Test:

- center
- top-left
- top-right
- bottom-left
- bottom-right

### Expected

Original grab point remains aligned with the pointer.

## Pointer Leaves Rectangle

Drag outside the rectangle while holding.

### Expected

- Drag continues.
- No re-grab.
- No release jump.

---

# 20. Zoom Tests

## Zoom In

Verify cursor-centered zoom.

## Zoom Out

Verify cursor-centered zoom.

## Zoom Bounds

Repeatedly zoom in/out.

### Expected

```text
minimum = 0.25×
maximum = 4×
```

No further zoom beyond limits.

---

# 21. Zoom + Drag Regression

Test:

1. Default zoom → drag
2. Zoom out → drag
3. Zoom in → drag
4. Center grab
5. Edge/corner grab
6. Pointer leaves shape
7. Release outside

### Expected

- Stable grab point
- No drift
- No snap
- No release jump
- No forward/backward flicker

---

# 22. Pan Tests

## Normal Pan

Pan in all directions.

### Expected

- Canvas moves correctly.
- Shapes retain relative positions.

## Edge Auto-Pan

Drag a shape toward a viewport edge and hold near the edge.

### Expected

- Canvas auto-pans.
- Shape continues following.
- Release does not jump.

---

# 23. Minimap Tests

## Shape Representation

Create multiple shapes.

### Expected

- Shapes appear.
- Relative positions are correct.

## Viewport Representation

Pan and zoom the main canvas.

### Expected

- Viewport indicator follows.
- Zoom in makes it smaller.
- Zoom out makes it larger.
- Whole-canvas bounds remain sensible.

## Minimap Click Navigation

Click a minimap location.

### Expected

Main canvas centers on the selected minimap location.

## Minimap Viewport Drag

Drag the viewport rectangle.

### Expected

- Main canvas moves accordingly.
- Viewport remains synchronized.
- Shapes do not move independently.

## Extreme World

Place shapes far apart.

### Expected

- Whole represented world remains visible in the minimap.
- Viewport remains correctly positioned.
- No artificial world-size limit is introduced.

---

# 24. Runtime Profiling Plan

## Chrome Performance — Drag

Record a clean drag-only trace.

Inspect:

- pointermove processing
- JavaScript duration
- RAF work
- layout
- paint
- dropped frames
- long tasks

## Chrome Performance — Zoom

Record:

- approximately 3 seconds zoom in
- approximately 3 seconds zoom out

Inspect:

- frame timing
- scripting
- layout
- paint
- React participation
- Minimap work
- long tasks

## React Profiler

Inspect:

- ShapeView commits
- sibling ShapeView renders
- App commits
- Minimap commits
- release-time commits

---

# 25. DevTools Instrumentation Issue

A DevTools error was observed:

```text
Cannot add child "5" to parent "2" because parent node was not found in the Store.
```

The visible source was the React DevTools browser extension.

Current rule:

- Do not modify application behavior solely to suppress this extension error.
- Use Chrome Performance for runtime/frame evidence.
- Treat DevTools instrumentation errors separately from application exceptions.

---

# 26. Definition of Done

A phase is complete only when:

- Build passes
- Relevant functional tests pass
- Previous-phase behavior still passes
- No known regression is introduced
- Required runtime evidence is captured
- Implementation ownership is clear
- Old duplicate logic can be safely removed

---

# 27. Current Next Steps

The current minimap and interaction state is **frozen**.

Do not begin cleanup yet.

When cleanup begins, it should be a separate focused phase:

```text
Frozen baseline
      ↓
one cleanup change
      ↓
build
      ↓
targeted regression
      ↓
record result
      ↓
next cleanup change
```

The current temporary diagnostics, unused/dead-code cleanup, and any remaining architectural cleanup are intentionally postponed.

---

# 28. Frozen Baseline Summary

| Area | Status |
|---|---|
| Initial assignment behavior | Frozen |
| Pointer interaction foundation | Complete / Frozen |
| Runtime drag optimization | Frozen |
| Viewport / pan / zoom | Complete / Frozen |
| Drag rewrite | Complete / Frozen |
| Drawing rewrite | Complete / Frozen |
| Zoom integration | Complete / Frozen |
| Minimap integration | Complete / Frozen |
| Minimap viewport DOM synchronization | Fixed / Frozen |
| Whole-canvas minimap | Frozen |
| Extreme-scale hit-target design | Deferred |
| Drawing edge auto-pan | Deferred |
| Temporary diagnostics cleanup | Deferred |
| Final comprehensive profiling | Pending |

**Baseline rule:** The current uploaded implementation is the reference point for future changes. Cleanup is deliberately postponed so future debugging does not accidentally alter already-validated behavior.
