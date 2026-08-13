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

- Current step: review round 2 answered (PASS, three Copilot threads closed in `cbf80900`), full gate re-run green
- Blockers: none — but see the merge sequence and ADR collision below, both of which must be settled before merge
- Next: wait for #665 (#571) **and** #663 (#570) to land, then rebase **once** against the final `main`

### Pending: merge sequence, and the ADR number collision

**This branch is third.** #665 (#571) merges first, then #663 (#570), then this
one. Both touch files this one touches, so the rebase happens **once**, against
the final `main` — rebasing after each would resolve the same conflicts twice.

`chore/571-treegrid-expansion` (PR #665) allocated **ADR-067** concurrently
(`ADR-067-expansion-is-the-collapsed-set-and-a-group-row-is-a-tree-node.md`).
`vp run adr:verify` reported 067 free on both branches and cannot see an
unmerged sibling, so neither claim was wrong when it was made. #665 merges
first, so **this one renumbers** — to whatever `adr:verify` reports free at the
time.

**Deliberately not done yet.** Both are still open, so renumbering now would
rename against a prediction. Do it during the rebase.

Recipe, verified against `origin/chore/571-treegrid-expansion` @ `0c2096fc`.
It covers #571 only — re-probe against #570 before starting, since its own
conflicts have not been enumerated here:

1. Rebase onto the landed `main`. **Three** files conflict with #571 — see
   below.
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
