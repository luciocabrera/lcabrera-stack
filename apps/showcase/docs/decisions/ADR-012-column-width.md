# ADR-012: Column Width as the First Instance of the Grid Interaction Architecture

**Status:** Proposed

## Context

Column resize is where the interaction-architecture gap first became visible, so
it is the first capability modelled under ADR-011. But resize is also the
capability with the most unresolved _product_ questions, and those questions are
independent of the architecture decision. This ADR separates the two so the
architecture (ADR-011) is not held hostage to the width UX, and vice versa.

The current state of width, verified in code:

- Width is set through **three** surfaces: the drag handle + keyboard splitter
  (live, exact pixels), the per-column drawer (draft, min/max/default presets),
  and the table-settings drawer (draft, all-column presets).
- The splitter is a deliberate, tested ARIA window splitter
  (`role="separator"` + focusable), correctly implemented — Biome mismodels it
  (documented in ADR-035) and a SonarQube sweep flagged it as false positives.
- Width persists to a cookie and is seeded by the SSR loader, so first paint
  matches committed state and does not shift at hydration (ADR-010). Any width
  mechanism must round-trip through that cookie.
- The per-column drawer's width presets are **disabled** for a column with no
  configured `minWidth`/`maxWidth`, because normalization does not backfill
  bounds — so a pointer user who cannot drag can _reset_ such a column but cannot
  _resize_ it.

## Decision

**Model column width as ADR-011 commands.** The width capability owns its effect
(clamp + persist) and availability; the commands are the named intents —
`Fit to content`, `Wider`, `Narrower`, `Reset`, `Set width` — exposed by the
header menu (live) and the drawers (draft). The pointer drag remains a
**surface-level accelerator**, not the canonical path: keyboard/click access is
guaranteed at the command layer, which is what makes the splitter's focusability
a stakes-free progressive-enhancement choice rather than an accessibility
obligation (ADR-011, accessibility section).

The concrete width _mechanics_ are **explicitly deferred** and do not block
ADR-011:

- **WCAG 2.5.7 (Dragging Movements) reading** — whether a keyboard alternative
  satisfies it or a single-pointer non-drag alternative is required. Load-bearing
  for whether the disabled-preset gap is a live AA failure. Unconfirmed.
- **Autofit under virtualization** — "fit to content" can only measure rendered
  rows, so it is scroll-dependent; dynamic row height (planned) makes it a
  width/height trade-off needing a per-column policy rather than a universal
  command.
- **Splitter de-focus** — gated on the navigation model (`role="grid"` + focus
  management), which row selection forces independently of resize.

Full evidence and the round-by-round reasoning live in the decision log at
`packages/ui/src/components/Table/docs/column-resize-decision-log.md`.

## Consequences

- ADR-011 can proceed and be validated (pinning + sorting) without resolving any
  width question. Width is not the validating slice precisely because it is the
  outlier.
- The disabled-preset behavior for unbounded columns is a candidate bug
  (`ResizeHandle` receives `minWidth ?? DEFAULT_MIN_COLUMN_WIDTH` while the
  drawer reads the raw un-defaulted `column.minWidth`); its fix is gated on the
  WCAG-2.5.7 reading above and is tracked in the decision log, not fixed here.
- When the width commands are implemented, `Set width` and `Fit to content` must
  round-trip through the ADR-010 cookie path so first paint stays shift-free; the
  first client-side autofit necessarily measures and therefore shifts once
  (user-initiated, CLS-exempt), then persists.
- This ADR stays **Proposed** until the deferred width questions are resolved;
  ADR-011 is independently **Accepted**.
