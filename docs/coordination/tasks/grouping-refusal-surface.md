---
id: grouping-refusal-surface
title: Render a server-refused group key instead of emptying the table
owner: agent:claude
status: review
branch: chore/642-grouping-refusal-surface
area:
  - packages/ui/src/components/Table/Table.component.tsx
  - packages/ui/src/components/Table/Table.constants.ts
  - packages/ui/src/components/Table/Table.test.tsx
  - packages/ui/src/components/Table/Table.types.ts
  - packages/ui/src/components/Table/TableEmptyState/**
  - packages/ui/src/components/Table/TableLayout/**
  - packages/ui/src/components/Table/TableHeaderCell/TableHeaderActionsMenu/GroupActions/**
  - packages/ui/src/components/Table/TableSettingsDrawer/GroupingSection/**
  - packages/ui/src/components/Table/commands/ARCHITECTURE.md
  - packages/ui/src/components/Table/contexts/TableData/**
  - packages/ui/src/components/Table/utils/**
  - packages/ui/src/components/TableRouteView/**
  - packages/ui/src/types/ui.types.ts
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/PATTERNS.md
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-08-13
updated: 2026-08-13
plan: (none)
pr: #662
issue: #642
---

## What

Render a server-refused group key instead of emptying the table.

Two halves, because either alone leaves the defect reachable. A refused read now
travels as data on `TablePageResponse.error` and the table's empty body renders
it — the refused column under its header label, the endpoint's own reason, and
**Clear grouping** in place of a Retry that would be refused again. And every
grouping affordance narrows the declared `isGroupable` with the catalogue's
answer through `resolveGroupKeyAvailability`, so a key the endpoint refuses is no
longer offered.

## Status / next

- Current step: implemented, full gate green, in review
- Blockers: none — but see the ADR collision below, which must be settled before merge
- Next: PR #662 out of draft; then rebase once #665 lands

### Pending: ADR number collision with #665

`chore/571-treegrid-expansion` (PR #665) allocated **ADR-067** concurrently
(`ADR-067-expansion-is-the-collapsed-set-and-a-group-row-is-a-tree-node.md`).
`vp run adr:verify` reported 067 free on both branches and cannot see an
unmerged sibling, so neither claim was wrong when it was made. #665 is further
along and merges first, so **this one renumbers** — to whatever `adr:verify`
reports free at the time, expected 068.

**Deliberately not done yet.** #665 is still open (checked: `state=OPEN`,
`merged=null`), so renumbering now would rename against a prediction. Do it
during the rebase, once #665 has actually landed.

Recipe, verified against `origin/chore/571-treegrid-expansion` @ `0c2096fc`:

1. Rebase onto the landed `main`. **Three** files conflict — see below.
2. `git mv` the ADR to the free number and update every reference to it: the
   filename, the `# ADR-NNN —` heading, the cross-links from
   `TableEmptyState/ARCHITECTURE.md`, `Table/utils/ARCHITECTURE.md`,
   `Table/commands/ARCHITECTURE.md`,
   `TableSettingsDrawer/GroupingSection/ARCHITECTURE.md`, `TableRouteView/ARCHITECTURE.md`,
   `contexts/TableData/ARCHITECTURE.md`, `PATTERNS.md`, `INVENTORY.md`, the
   enterprise-orders `ARCHITECTURE.md`, the changeset, and the PR body.
   `grep -rn 'ADR-067' --include='*.md' .` finds them; #665's own references
   must be left alone.
3. **Regenerate, never hand-merge, the two generated files** — take either side
   wholesale to clear the conflict, then run the generator and commit its output:
   - `docs/decisions/README.md` → `vp run adr:verify -- --write`
   - `reports/api-surface/ui.txt` → `vp run api-surface:verify -- --write`
4. `packages/ui/src/components/Table/Table.types.ts` is the one substantive
   conflict and is pure adjacency: both branches add a new exported type at the
   same alphabetical insertion point (`TableGroupExpansionState` from #665,
   `TableGroupingRefusalReason` here). Keep **both**, #665's first — that is the
   order `perfectionist/sort-modules` requires. `packages/ui/src/INVENTORY.md`
   auto-merges.
5. Re-run the **full gate on the rebased head**, including
   `vp run --filter vite-react-compiler test:smoke` against a live database. A
   clean rebase is a text operation and proves nothing about behaviour.

**Correction to the hand-off:** the claim that a test-merge reports zero textual
conflicts across the four shared files does not reproduce. Against
`origin/chore/571-treegrid-expansion` @ `0c2096fc`, both
`git merge-tree --write-tree HEAD <other>` and a real
`git rebase --onto <other> <merge-base>` in a throwaway worktree report content
conflicts in `docs/decisions/README.md`,
`packages/ui/src/components/Table/Table.types.ts` and
`reports/api-surface/ui.txt`; only `packages/ui/src/INVENTORY.md` auto-merges.
The likely confound is a test-merge taken at an earlier head of #665, before it
added `TableGroupExpansionState` and its own index row. **Precondition:** both
heads as of 2026-08-13 (`689cb8e3` here, `0c2096fc` there); #665 will land
squashed, so the exact text will differ while the three files will not.

None of the three is a hazard once resolved the way step 3 and step 4 say — two
are regenerated and the third is disjoint — but they are conflicts, and a rebase
planned as "mechanical, no conflicts" is one that gets `--force`d through.

**Behavioural overlap, checked rather than assumed:** #665 changes
`TableBody.component.tsx` to size the virtualization window by the _visible_
rows (`useTableGroupTree().rows.length`) instead of `totalLoadedRows`. That is
the populated branch only: `isEmpty` is deliberately left on the loaded count by
#665 itself, and the empty branch returns before any virtualization output is
read. This task touches `TableEmptyState/` and not `TableBody`, and #665 touches
`TableBody` and not `TableEmptyState/`. The gate still gets re-run on the
rebased head — this narrows where to look, it does not replace the evidence.
