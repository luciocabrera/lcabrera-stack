---
id: grouped-tables-open-the-way-i-set-them
lines:
  - application
persona: data-user
state: met
packages:
  - ui
requires:
  - a-grouped-grid-reads-as-the-report-i-arranged
issues: []
evidence:
  - type: command
    ref: vp run test:ci
  - type: test
    ref: packages/ui/src/components/Settings/Settings.component.test.tsx
  - type: test
    ref: packages/ui/src/components/Table/contexts/TableConfig/expansion/utils/resolveTableGroupTree.util.test.ts
  - type: code
    ref: packages/ui/src/components/Settings/GroupingSettingsTab/GroupingSettingsTab.component.tsx
  - type: doc
    ref: docs/decisions/ADR-103-the-expansion-set-holds-the-exceptions-to-a-default-fold.md
---

# Grouped tables open the way I set them

## Statement

I summarise tables all day and I want the same shape every time: subtotals or
not, subtotals above the rows or below, and groups closed so I land on the
summary rather than scrolling past thousands of rows to find it. I should be
able to say that once, in Settings, rather than on every table. Saying it should
not overrule a link somebody sent me, and it should not undo a choice I have
just made on the table in front of me.

## Acceptance

- Settings carries a Grouping tab holding the totals mode, the totals position
  and the default group fold, and Accept persists them. Decided by
  `Settings.component.test.tsx` → "persists a grouping preference from the
  Grouping tab".
- Choosing the shipped default clears the preference rather than storing it, so
  a later change to that default is not silently overridden. Decided by the same
  file → "writes a preference back to undefined when it returns to the default".
- A `collapsed` default folds every group on the first paint, with no group path
  enumerated and no data needed to name one. Decided by
  `resolveTableGroupTree.util.test.ts` → "hides every subtree with nothing in
  the set at all", and the three cases that open one chain at a time.
- Both fold-all directions work either side of the default. Decided by
  `resolveFoldAllTarget.util.test.ts` → all four cases, and by
  `countCollapsedGroups.util.test.ts` → "reports a fully folded grid from an
  empty set under a collapsed default".
- A preferred totals mode starts a grouping and then leaves it alone, so
  switching the mode back sticks. Decided by
  `TableDrawerContext.hooks.test.tsx` → "leaves a second key alone, so switching
  the mode back sticks", and by `resolveNewGroupingMode.util.test.ts`.
- A shared link outranks the preference for the totals position. Decided by
  `resolveLoaderTotalsPlacement.util.test.ts`.
- None of it changes a table for a reader who has set nothing. Decided by
  `resolveNewGroupingMode.util.test.ts` → "keeps the previous mode when no
  preference is set", and by every expanded-default case in the expansion
  suites.

## Notes

The `command` pointer was checked the way this register requires rather than
assumed: replacing `isGroupCollapsed`'s body with the old membership test — the
behaviour before this change — fails eight cases and only the collapsed-default
ones, leaving every expanded-default case green. That is both halves of the
claim: the new behaviour is tested, and the old behaviour is preserved where it
applied. The run is in
[#1053](https://github.com/luciocabrera/lcabrera-stack/pull/1053).

The three preferences deliberately do **not** share a seam, and the middle one
is the reason. The totals position resolves in the loader; the default fold
seeds the expansion store; the totals mode resolves at the interaction that
creates a grouping, because the URL codec drops a `flat` mode rather than
emitting it — so a link whose author chose flat and one whose author chose
nothing are the same string, and a preference read from the param would
reinstate itself every time the reader switched back. ADR-103 records that.
