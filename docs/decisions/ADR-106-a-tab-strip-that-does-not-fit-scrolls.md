---
governs:
  - ui
---

# ADR-106 — A tab strip that does not fit scrolls, with a chevron at each edge that has more

**Status:** Accepted

**Issue:** [#1054](https://github.com/luciocabrera/lcabrera-stack/issues/1054)

## Context

`TabsHeader` laid its buttons out in one flex row with no overflow rule. Where
the row was wider than its container the last tabs were clipped — the panel they
belong to was still selectable by keyboard, since ArrowRight moves through every
tab, but there was nothing to click and nothing saying more tabs existed. The
Table's global settings drawer is where this bites: the tab count depends on the
table (`Grouping` appears only when the route declares the capability), the
drawer is resizable, and at its narrower widths `Columns` was cut in half with
`Details` invisible behind it.

## Decision

The tab strip sits in a viewport that scrolls horizontally with the scrollbar
hidden, and a chevron button appears at an edge only while there is something
past it. `useTabsHeaderScroll` owns that answer: it measures the viewport
against its content on mount, on a `ResizeObserver` watching both the viewport
and the list, and on a rAF-batched `scroll` handler — the shape
`setupObservedContainer` already uses, so no layout read happens inside the
listener itself. Each chevron scrolls by 80% of the viewport, through
`scrollLeft` with `scroll-behavior: smooth` doing the animation in CSS.

The chevrons are `aria-hidden` with `tabIndex={-1}`. They are a pointer
affordance for a strip the keyboard already reaches: arrow keys move through
every tab, focus scrolls the target into view, and `scrollTabIntoView` covers
the selection that changes without a keypress — a drawer reopening on the tab it
was left on.

The `tablist` element keeps its role, its label and its keydown handler, and the
bottom rule stays on it with `min-width: 100%`, so the line still spans the
header at any scroll position and the active tab's border still overlaps it.

## Consequences

**No tab is unreachable at any drawer width**, and adding one to a drawer is no
longer a layout question.

**The strip's affordances are pointer-only.** A screen-reader user is not told
the strip scrolls; they do not need to be, because the tabs are all in the
accessibility tree and arrow keys reach them.

**Two elements are observed per header.** The list is watched as well as the
viewport, because a tab set that changes — the `Grouping` tab arriving with a
capability — changes the content width without resizing the container.

## Alternatives considered

1. **An overflow menu collecting the tabs that do not fit.** Rejected: it needs
   a measurement per tab to decide the cut, and it moves a tab between two
   controls as the drawer resizes, so the same tab is in a different place each
   time the reader looks.
2. **Wrap the strip onto a second row.** Rejected: the header grows into the
   panel exactly when the drawer is narrowest and the panel has least room.
3. **Shrink the tab labels.** Rejected: it buys one or two tabs and costs every
   reader legibility at every width.

## References

- [#1054](https://github.com/luciocabrera/lcabrera-stack/issues/1054)
- `packages/ui/src/hooks/utils/setupObservedContainer.util.ts` — the observe +
  rAF-batched scroll shape this follows.
