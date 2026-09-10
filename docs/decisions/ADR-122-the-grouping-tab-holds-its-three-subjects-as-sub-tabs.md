---
governs:
  - ui
---

# ADR-122 — The grouping tab holds its three subjects as sub-tabs

**Status:** Accepted

**Corrects:** [ADR-115](./ADR-115-the-settings-panel-separates-what-the-table-asks-from-how-the-panel-is-shaped.md),
whose `advanced` role this replaces: the paragraph creating that role and the one
scoping the Grouping tab to dimensions and measures. Everything else ADR-115
decided stands — the global tab order, the General tab's clear-and-reset pair,
and the truncating draggable label.

## Context

[ADR-115](./ADR-115-the-settings-panel-separates-what-the-table-asks-from-how-the-panel-is-shaped.md)
found the grouping mode radio sitting between the group keys and the aggregates
in one scrolling column, and moved it out to a new top-level `advanced` role
alongside the totals position. The objection it recorded is precise: the mode is
a totals question, "not a dimension or a measure", and it interrupted a run of
controls that were.

That fixed the interruption by moving the subject out of the panel section that
owns it. Both controls decide what a grouped read emits, so the tab they landed
on exists only when a grouping is applied, and it renders nothing at all under a
locked preset outside `rollup` — which is why `useHasAdvancedSettings` had to
exist to decide whether to register the tab. A top-level strip entry that
appears and disappears with another tab's state is a strip entry that depends on
a tab beside it.

Meanwhile the Grouping tab kept two subjects in one scroll. Group keys and
aggregates are separate questions with separate pickers and separate lists, and
a reader configuring one scrolled past the other.

## Problem

Adjacency and membership were being treated as the same thing. ADR-115 read "the
mode interrupts the keys and the measures" as "the mode does not belong here",
and the only tool it had for separating subjects was another entry in the top
strip.

## Options considered

1. **Leave the `advanced` role and split only keys from aggregates.** Rejected:
   it keeps a top-level tab whose existence is conditional on a sibling tab's
   state, and the reader still crosses the strip to answer a question about the
   grouping they are editing.
2. **Put all three subjects in one scroll with headings.** Rejected: this is what
   ADR-115 corrected. Headings do not stop a reader scrolling past a subject to
   reach another.
3. **Chosen.** A tab strip inside the Grouping tab, one entry per subject.

## Decision

**The Grouping tab paints its own tab strip: Group Keys, Aggregates, Advanced.**
`GroupingSection` becomes a shell over a nested `Tabs`. `GroupKeysSubsection`
holds the key picker and the staged key list with the picker's dimming overlay;
`AggregatesSubsection` holds the aggregate picker and the staged measure list;
`AdvancedSettingsSection` holds the grouping mode and the totals position, and
moves under `GroupingSection/` to sit with the tab that renders it.

**The `advanced` role is deleted.** `TABLE_SETTINGS_TAB_ROLES`,
`TABLE_SETTINGS_TAB_ROLE_LABELS`, `TABLE_SETTINGS_TAB_ROLE_BY_KEY` and the
`TableSettingsTabRole` union lose it, and `TableSettingsDrawerBody` no longer
registers a tab for it. The top strip is General, Columns, Filters, Sorting,
Grouping, Details.

**`useHasAdvancedSettings` now gates the sub-tab rather than a strip entry.** Its
conditions are unchanged and it stays the single place they are combined, as
ADR-115 established. A locked, non-`rollup` grouping paints two sub-tabs instead
of three.

**The clear-and-reset pair stays outside the strip.** `GroupingSectionToolbar`'s
footer variant acts on the whole grouping, so it sits below the nested `Tabs`
where it governs all three panes rather than inside one of them.

**The sub-tab selection is not persisted.** The nested `Tabs` is uncontrolled and
opens on Group Keys. The outer tab is remembered because a reader returns to the
drawer expecting the pane they left; which sub-tab they were on is a step inside
one editing session.

**`Tabs` takes a `label`, defaulting to the string it used to hardcode.** Two
tab strips on one page cannot both be named "Settings tabs" — the accessible name
is how a reader tells them apart, and how a role query selects one.

## Consequences

**Two of the three sub-tabs still commit by different routes, and the strip does
not say so.** The grouping mode stages into the grouping draft and commits to the
`grouping` search param; the totals position stages into its own draft and
commits to the `totals` param and the UI-flags cookie
([ADR-085](./ADR-085-a-preset-makes-ungrouped-a-real-state.md)). Sub-tabs
separate the subjects a reader is answering. They do not unify the commit paths,
and nothing here makes that difference visible.

**A stored global tab order naming `advanced` loses that entry.**
`resolveSettingsTabOrder` drops a name that is not a role, so the remaining roles
keep their positions and nothing else is needed. A stored
`tableSettingsSelectedTab` of `advanced` falls back to the first tab, because
`Tabs` falls back when the requested key is absent — the reader lands on General
rather than on Grouping once, and one click corrects it. That is the same
degradation ADR-115 accepted for its own migration.

**Two `*.stylex.ts` modules moved package-relative paths**, so
`stylex-module-paths.test.json` is updated in the same commit. Neither calls
`defineVars`, so no custom property is renamed and no consumer's `createTheme`
can drift; the register is blunter than the risk, deliberately — the same
situation ADR-115 hit moving three modules the other way.

**A test that reaches a grouping control now opens a sub-tab first.** Both
pickers were on screen together and are not any more, so the suite's staging
helpers select a tab before clicking. The multi-edit commit test is stronger for
it: it stages a key on one sub-tab and an aggregate on another and still asserts
one navigation.

**The Grouping tab now nests a scroll container inside a scroll container**, since
`Tabs` gives its content pane `overflow: auto`. Each pane is shorter than the
single column it replaces, so nothing is unreachable, but a very narrow panel has
two scrollbars in the same region.

## Alternatives considered

1. **Fold Advanced into Details instead.** Rejected for the reason ADR-115 gave
   when it considered the same move: Details is read-only metadata, and putting
   writes behind a tab that otherwise writes nothing hides them.
2. **Persist the sub-tab selection alongside the outer one.** Rejected: it needs
   a new key in the UI-flags cookie and a second vocabulary of tab names, to
   remember a step the reader takes inside a single visit to one tab.
3. **Keep `advanced` as a role and render it inside Grouping.** Rejected: the
   role vocabulary is what the Settings page's drag list offers a reader to
   order, and an entry there that does not appear in the strip is worse than no
   entry.
4. **Give the nested strip no accessible name and let it inherit the default.**
   Rejected on what it produces: two `tablist` elements named "Settings tabs",
   which is ambiguous to a screen-reader user and to every `getByRole` query in
   the suite.

## References

- [ADR-115](./ADR-115-the-settings-panel-separates-what-the-table-asks-from-how-the-panel-is-shaped.md) — the `advanced` role this replaces
- [ADR-114](./ADR-114-the-settings-panel-takes-the-shape-the-reader-gives-it.md) — the tab order and the panel shape
- [ADR-085](./ADR-085-a-preset-makes-ungrouped-a-real-state.md) — where totals placement commits
- [#1162](https://github.com/luciocabrera/lcabrera-stack/issues/1162)
