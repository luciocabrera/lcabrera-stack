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

- Current step: rebased onto `main` after #665 and #663 landed; ADR renumbered to 068; full gate re-run on the rebased head
- Blockers: none
- Next: merge

### Done: merge sequence, and the ADR number collision

**This branch was third**, behind #665 (#571) and #663 (#570), so the rebase
happened **once** against the final `main` rather than twice.

`chore/571-treegrid-expansion` (PR #665) allocated **ADR-067** concurrently
(`ADR-067-expansion-is-the-collapsed-set-and-a-group-row-is-a-tree-node.md`).
`vp run adr:verify` reported 067 free on both branches and cannot see an
unmerged sibling, so neither claim was wrong when it was made. #665 landed
first, so this one renumbered to **ADR-068**.

**Renumbering needs a discriminator, because both ADR-067s coexist mid-rebase.**
A repo-wide `grep -rn 'ADR-067'` finds this branch's references _and_ #571's, and
most are bare `(ADR-067)` mentions that name no filename. What separates them is
authorship, so the rename was driven by the lines this branch **adds**:

```
git diff origin/main -- . ':(exclude)docs/decisions/README.md' \
  | awk '/^\+\+\+ /{f=$2} /^\+/ && /ADR-067/ {print f"  ::  "$0}'
```

Every line it prints is this branch's and renumbers; everything else the repo-wide
grep finds is #571's and stays. `adr:verify` then confirms the result — it reports
a duplicate number if one side was missed, and a stray if a file and its heading
disagree.

**What actually conflicted — six files, not the three predicted here.** The
earlier probe covered #571 only; #663 added three more:

| File                            | Kind                | Resolution                                                          |
| ------------------------------- | ------------------- | ------------------------------------------------------------------- |
| `docs/decisions/README.md`      | generated           | `vp run adr:verify -- --write`                                      |
| `reports/api-surface/ui.txt`    | generated           | `vp run packages:build` then `vp run api-surface:verify -- --write` |
| `Table.types.ts`                | adjacency           | keep both, #571's first                                             |
| `Table.constants.ts`            | adjacency           | keep both — an import member and an appended block                  |
| `stylex-module-paths.test.json` | **hand-maintained** | keep both new entries; drop the deleted one                         |
| `INVENTORY.md`                  | **semantic**        | see below                                                           |

The last two are the ones a mechanical "keep both sides" gets wrong.
`stylex-module-paths.test.json` looks generated and is not — it is the frozen
register that gives each `*.stylex.ts` path its identity, so a wrong entry there
renames custom properties for every consumer. And in `INVENTORY.md` both sides
touch the same rows for different reasons: #663 **deleted** `TableGroupHeaderRow`
(ADR-065 replaced the banner), while this branch's side still lists it and also
rewrites the `TableEmptyState` row. Keeping both sides would have reinstated a
component that no longer exists. Resolution: #663's `TableGroupAggregate` and
`TableGroupLabel` rows, this branch's `TableEmptyState*` rows, and no
`TableGroupHeaderRow` row at all.

A clean rebase is a text operation and proves nothing about behaviour, so the
full gate — including `vp run --filter vite-react-compiler test:smoke` against a
live database — was re-run on the rebased head, not inherited from before it.

**A "zero conflicts" hand-off was wrong, and the cause is settled.** The
original claim came from the **deprecated three-argument** `git merge-tree`,
which writes no `CONFLICT` lines at all — so the grep looking for them could
never have matched, whatever the trees contained. A green result there is not
evidence of a clean merge; it is evidence the command was not asked the
question. Use `git merge-tree --write-tree <a> <b>` (or a real rebase in a
throwaway worktree), both of which report:

- `docs/decisions/README.md` — generated, regenerate
- `packages/ui/src/components/Table/Table.types.ts` — pure adjacency, keep both
- `reports/api-surface/ui.txt` — generated, regenerate

Only `packages/ui/src/INVENTORY.md` auto-merges. **Preconditions:** heads as of
2026-08-13 (`689cb8e3` here, `0c2096fc` on #571); both PRs land squashed, so the
exact text will differ while the file set will not. #570 reportedly conflicts in
five files, not probed here.

This is the same trap as Rule 14 in miniature: a command that cannot fail the
way you are testing for reports exactly what a passing case reports.

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
