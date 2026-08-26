# ADR-002: CSS Anchor Positioning for Tooltip

**Status:** Accepted

## Context

Tooltips need to appear adjacent to a trigger element at one of four placements (top/bottom/left/right). Options: JS-calculated absolute position (e.g. Floating UI / Popper.js), a CSS `position: fixed` + `useLayoutEffect` approach, or the CSS Anchor Positioning API.

## Decision

Use the CSS Anchor Positioning API (`anchor-name`, `position-anchor`, `position-area`) combined with the native Popover API (`popover="manual"`).

## Reasons

- **Zero JS positioning math** — placement is declared in CSS via `position-area`; the browser handles the geometry.
- **Top layer via Popover API** — the tooltip is always above all other content without `z-index` management.
- **No dependency** — eliminates Floating UI / Popper.js entirely.
- **CSS transitions just work** — opacity and transform transitions apply naturally since the element is always in the DOM (just hidden in the top layer).
- **`useId`-based anchor names** — each Tooltip instance gets a unique `--tooltip-{id}` CSS custom property name, so multiple tooltips coexist without conflict.

## Consequences

- Arrow pixel offset still requires one JS measurement (`getBoundingClientRect`) on show — the Anchor Positioning API doesn't yet expose the trigger's cross-axis centre to CSS.
- CSS Anchor Positioning is a newer API (Baseline 2024 — Chrome 125+, Safari 18+, Firefox behind flag). Not suitable for apps requiring broad legacy browser support.
- `hidePopover()` must be deferred by `TRANSITION_DURATION_MS` (150ms) so the CSS fade-out completes before the element leaves the top layer.
