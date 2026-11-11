---
governs:
  - ui
---

# ADR-148 — Table density falls back from the table, to its prop, to the global default

**Status:** Accepted

**Date:** 2026-11-11

**Issue:** [#1622](https://github.com/luciocabrera/lcabrera-stack/issues/1622)

**Relates to:** [ADR-115](ADR-115-the-settings-panel-separates-what-the-table-asks-from-how-the-panel-is-shaped.md), [ADR-103](ADR-103-the-expansion-set-holds-the-exceptions-to-a-default-fold.md)

## Context

A table's row density and header density each resolved in two steps: the level
the table's own state holds, then the `density` / `headerDensity` prop, then
`compact` for the rows and the row level for the header. A reader who prefers
another level had to choose it on every table. Global Settings already holds
table defaults for grouping, so density is the next value of the same kind.

The settings drawer could not express "go back to the default". It staged the
resolved level and wrote it only when it differed from the resolved level, so
once a table held a level of its own, nothing in the panel removed it. The
header level had no control at all.

The density radios also sat in the General tab, which ADR-115 reserves for the
query state's clear and reset.

## Options considered

1. **Global default above the prop.** The reader's preference would win on
   every table, including one whose author chose a level for a reason, such as
   a dense audit grid. The author would have no way to say "this table is
   always dense" short of locking the control. Rejected.
2. **Global default below the prop.** The author's explicit level is a decision
   about that table; the reader's global preference fills in where the author
   said nothing. The reader can still override either one on the table itself.
   Chosen.
3. **Per-table only, no global default.** The status quo. It is the cost the
   issue reports. Rejected.

## Decision

Each level resolves in this order, first value wins:

1. the table's own state (`density`, `headerDensity`), set from the drawer;
2. the `Table` prop of the same name;
3. the Global Settings default, `tableDisplay.density` / `tableDisplay.headerDensity`;
4. `compact` for the rows; the resolved row level for the header.

The global default enters where the props do: `TableGridContent` provides
`TableDensityContext` with `prop ?? global` for each level, so
`resolveTableDensity` keeps one resolution path. The read tolerates a table
rendered without a Global Settings provider and resolves as if no default were
set.

The drawer stages the table's own values, which may be unset. Each density
group leads with a default option, named for the level it falls back to.
Choosing it clears the table's value. Accept sends a `TableDensityPatch` that
names only the levels that moved, so a cleared level travels as `undefined`
rather than vanishing. `headerDensity` is persisted in the UI-flags cookie
beside `density`.

The density controls and the column-width presets leave General for a
**Display** tab, the `display` settings-tab role, placed after Details. A
stored tab order that predates the role still opens a complete strip, because
`resolveSettingsTabOrder` appends any role it was not given.

## Consequences

- A table whose author sets `density` ignores the reader's global default. A
  reader who wants it changed does so in that table's drawer. The drawer's
  default option names the fallback level, not where it came from, so the
  reader cannot see whether the prop or Global Settings supplied it.
- `GlobalSettingsState` gains a required `tableDisplay` member. A consumer that
  builds the state by hand, for `initialSettings`, must add `tableDisplay: {}`.
- Changing the global default re-renders every mounted table without its own
  level, because the read subscribes to the global store.
- `ColumnWidthsSection.stylex.ts` moves with its section. It defines no
  variables, so no consumer theme key changes.

## Alternatives considered

- **Resolve the global default inside `resolveTableDensity`** as a third
  argument. It would keep the prop and the global value apart, which the
  drawer could use to name the source. It also adds a parameter to every
  caller of the resolver for a distinction nothing else needs. Rejected; the
  context already carries "the table's defaults".
- **Keep "Same as body" as the header's default label in every case.** It is
  wrong whenever a header prop or a global header default is set, since the
  header then does not follow the rows. The label reads "Same as rows" only
  when nothing sets a header default, and names the level otherwise.

## References

- [#1622](https://github.com/luciocabrera/lcabrera-stack/issues/1622)
- `docs/product/requirements/table-density-follows-my-default.md`
