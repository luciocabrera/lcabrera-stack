# ADR-012: Column Width as the First Instance of the Grid Interaction Architecture

**Status:** Proposed — deliberately open, not un-triaged; see [Status, 2026-08-26](#status-2026-08-26)

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

## Status, 2026-08-26

This ADR is still **Proposed**, and that is the intended state rather than a
status nobody moved — the Decision above is a proposal whose commands are not
built. What follows is where its three deferred questions stand, so a reader can
tell what binds them and what would close this.

**Closed: splitter de-focus.** The question was gated on the navigation model,
and
[ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md)
decided that model. `ResizeHandle` is now `tabIndex={-1}` against the grid's
single roving tab stop, and its own docblock cites ADR-062 for exactly this. It
keeps `role="separator"` and the full `aria-value*` set, so the ARIA
window-splitter reading in the Context is unchanged.

More changed than tab-order participation, and it is worth stating precisely,
because the imprecise version is tempting and wrong: **de-focus removed keyboard
access to incremental, exact-pixel resize — not keyboard access to width.** The
splitter still handles keys, with `useColumnResize` routing `Home`, `End` and the
arrows through `resolveKeyboardResizeAction.util.ts`, but nothing can focus it
any more, so that behaviour is unreachable. `ResizeHandle`'s docblock hands
keyboard access to the header command instead, and that command is the one this
section records as unimplemented.

The drawer remains reachable, and it is a genuine keyboard path to width: the
header actions trigger is a native `Button` with no `tabIndex` override and a
layout-only trigger style, so Tab reaches it; `ManageColumnAction` opens the
column drawer; and `GeneralSectionHeader`'s width presets commit through
`setDraftColumnSizing` on Accept. That is one of the three surfaces the Context
already describes.

So the gap is narrower and more specific than "no keyboard access": a keyboard
user gets **presets, not pixels** — and for a column with no configured bounds
the Min and Max presets are disabled (`isMinDisabled={!hasMinWidth}`,
`isMaxDisabled={!hasMaxWidth}`), leaving only Reset. An **unbounded column has no
keyboard resize at all**, which is the Context's existing candidate bug
reappearing as the sharpest edge of this question.

**Still open: the WCAG 2.5.7 (Dragging Movements) reading.** Nothing in the tree
or in either decisions home has taken a position on it since. The paragraphs
above sharpen what has to be read rather than answering it: 2.5.7 turns on
whether a single-pointer non-drag alternative is required where a keyboard one
exists, and here the keyboard alternative is preset-only and disappears entirely
for an unbounded column. That is the case to weigh — not an absence of any
alternative.

**Still open: autofit under virtualization.** `Fit to content` is not
implemented, so the scroll-dependence and the width/height trade-off under
dynamic row height are untested rather than resolved.

**The Decision is unimplemented.** None of `Fit to content`, `Wider`, `Narrower`,
`Reset` or `Set width` exists in the header actions menu. Width is still set
through the three surfaces the Context describes. Do not read this ADR as
recording current practice.

**The candidate bug is still live.** `ResizeHandle` reads
`minWidth ?? DEFAULT_MIN_COLUMN_WIDTH` while the drawer's `GeneralSectionHeader`
tests the raw `column.minWidth !== undefined`, so a column with no configured
bounds still offers a reset it will not resize.

**What would close this ADR:** a reading of WCAG 2.5.7 that settles whether a
keyboard alternative suffices, and a per-column autofit policy under
virtualization. Either outcome is a status move here, not a new ADR — the
decision itself is not being re-argued.
