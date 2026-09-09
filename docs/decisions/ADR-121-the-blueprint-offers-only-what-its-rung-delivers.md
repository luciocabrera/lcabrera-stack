---
governs:
  - devkit
---

# ADR-121 — The blueprint offers only what its rung delivers

**Status:** Accepted

**Issue:** [#1076](https://github.com/luciocabrera/lcabrera-stack/issues/1076)

## Context

The `monorepo` rung emits an application whose page renders a grid through the
component library. The rows are in a module: there is no server, no database
and no fetch, which is the property that makes the rung falsifiable on its own.

The library's column type carries capability flags, and every one of them
defaults to **on**. A column that says nothing therefore offers sorting and
filtering, and the grid puts the controls for both on screen — sort actions in
each column's header menu, and a column picker in each of the settings panel's
sorting and filtering tabs.

Neither is resolved in the browser. The grid submits its state and renders the
page that comes back, so a sort or a filter is applied by whatever answers the
read. A page assembled from a module answers the same rows to every request, so
both controls take a click and change nothing.

Three defects already fixed on the way to this rung have the same shape: a total
the page could never reach, a header count asserted for two columns rather than
all of them, and a submission path no route answered. Each was the blueprint
claiming something it did not do.

## Options considered

1. **Apply sorting and filtering to the rows inside the page reader.** Rejected.
   It cannot produce a working control at this rung: the sort a header menu
   submits never reaches the loader, because the control closes its popover in
   the same handler that submits and the router discards the redirect belonging
   to a fetcher queued for deletion
   ([#1153](https://github.com/luciocabrera/lcabrera-stack/issues/1153)) — driven
   in a browser, the grid reports `aria-rowcount="-1"`, the rows do not move, and
   no further read is made. It would also put a filter evaluator in a blueprint,
   duplicating operator semantics the stack resolves in a read, which is the
   opposite of the pattern a reader should copy from a first example.

2. **Declare the capabilities off on every column.** Chosen. The grid then
   offers what this rung can answer and nothing else, and the flags are the
   single place a later rung turns them back on.

## Decision

Every column the emitted page declares sets `isSortable: false` and
`isFilterable: false`. The page reader takes no argument, because nothing in the
request can change the page it answers.

The header menu consequently offers pinning, hiding and column management; the
settings panel's sorting and filtering tabs offer no column to pick. Grouping was
never offered — it is off unless a route asks for it — so no flag is written for
it, and writing one would suggest otherwise.

Tests hold this from both sides. The kit's own suite loads the blueprint's column
declarations and fails on any column that does not turn both off. The application
ships tests of its own that assert the same declarations, and that no header is
announced as sortable in a rendered grid — the latter reads the library's
resolved capability rather than the literal, so it fails if the flags are dropped
from a single column.

## Consequences

The first example a reader copies shows a smaller grid than the library can
render. That is the cost, and it is the intended one: a reader now learns that a
capability is declared per column and answered by the read, rather than learning
that a control may do nothing.

The settings panel still shows a sorting tab and a filtering tab, because the
panel builds its tab strip without consulting the columns. They are empty and
accept no input, so nothing there can appear to work; removing them is a change
to the component library, not to the blueprint.

Turning the capabilities on later is deleting two flags per column — and doing
that without also making the read answer them puts this defect straight back,
which is what the tests above exist to catch.

## References

- [#1076](https://github.com/luciocabrera/lcabrera-stack/issues/1076) — the rung
  that emits the application.
- [#1153](https://github.com/luciocabrera/lcabrera-stack/issues/1153) — the sort
  submitted from a closing menu that never reaches the read.
- [ADR-100](./ADR-100-the-header-menu-refuses-the-layout-actions-a-grouped-column-cannot-take.md)
  and
  [ADR-102](./ADR-102-the-sorting-tab-offers-only-the-terms-the-grouped-read-applies.md)
  — the same rule applied inside the component library.
