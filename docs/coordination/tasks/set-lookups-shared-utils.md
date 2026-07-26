---
id: set-lookups-shared-utils
title: Replace array-scan lookups with Sets in the shared Table/VirtualList/VirtualSelect utils
owner: agent:claude
status: active
branch: chore/460-set-lookups-shared-utils
area:
  - packages/ui/src/components/Table/utils/**
  - packages/ui/src/components/Table/TableSettingsDrawer/FiltersSection/utils/**
  - packages/ui/src/components/VirtualList/utils/**
  - packages/ui/src/components/VirtualList/contexts/data/actions/utils/**
  - packages/ui/src/components/VirtualSelect/utils/**
started: 2026-07-26
updated: 2026-07-26
plan: (none)
pr: #461
issue: #460
---

## What

The `js-set-map-lookups` findings that sit **outside** `ColumnOrderSection` —
`array.includes()` / `.find()` inside a loop over the column or option list.
Nine files, and no other claim covered them, which is what blocks promoting the
rule from advisory to `error`.

The end state for the rule family is: every finding fixed, then
`js-set-map-lookups` set to `error` in `doctor.config.jsonc`. There is no
baseline file to hold inherited findings (ADR-055 — severity is the only dial),
so the flip has to come after the last fix, in that PR.

## Status / next

- Current step: claimed; auditing the nine files for the shared shape before
  editing any of them
- Blockers: none
- Next: land the shared helper + these nine, so ColumnOrderSection can consume it

## Coordination

**Split of the `js-set-map-lookups` family**, agreed with the agent on #452/#454:
`ColumnOrderSection/**` is theirs to re-claim (their previous claim lapsed when
the merged `react-doctor-combine-iterations` task file was deleted in #459 — they
are filing a fresh one rather than relying on it), these nine files are mine.
They flip the rule to `error` and update ADR-055 and the triage doc in the same
PR as their last fix.

Each of these nine is verified individually before it is touched. A blanket
"all 34 are real" was asserted earlier on the strength of the densest sites plus
a sample; that is not the same as having checked, and the distinction is the
whole point of Rule 14.

**Deliberate duplication risk, and why this lands first.** Both halves are the
same two shapes — "key array → Set for O(1) membership", and "partition/reorder a
column list by a key list". Fixed independently we would each invent the same
helper. This PR puts the shared helper in one place and the other half consumes
it, which is why the ordering matters rather than being a preference.

**Overlap with `real-array-bench-poc` (#454)** is real but narrow: its area is
`packages/ui/src/**/*.bench.ts`, which intersects these directories only on bench
files. Nothing here edits a `*.bench.ts`. Worth knowing in the other direction
though — changing `getEffectiveColumns` changes what any bench over it measures,
so #455 may need a re-run after this lands.

**Correction to the shared "not a frame-time win" line — it holds for the Table
half only.** That claim was made from the Table trace and over-generalised to all 15. The nine files split into two very different paths:

- **Table (10 findings)** — `getEffectiveColumns`, `getPinnedColumnOffsets`, the
  two pinned-insert helpers, `areAllFiltersExpanded`. Reached from
  `getInitialColumnsState`, the two drawer-Apply resolvers and the
  pin/visibility commit actions: mount and settings-commit. Scaling correctness
  and mount cost, not frame time. As previously stated.
- **VirtualList/VirtualSelect (5 findings)** — `getFilteredOptions` and
  `getIsAllSelected` are both called by `resolveListDerivedState`, which runs
  from `useSetSearchTerm` on **every keystroke** in the select's search box,
  over a list that is virtualized precisely because it is large.
  `getIsAllSelected` runs unconditionally on that path and is
  `filteredOptions.every((o) => selectedValues.includes(o))` — O(n·m) per
  keystroke, with m growing to n after a Select All. This half **is** typing
  latency.

So the family should not be described as uniformly cold. The hottest site in the
whole `js-set-map-lookups` set is in the virtual list, not the table.

Worth noting for whoever writes the verdict: `resolveSelectAllFilter` already
builds a `Set` on one branch and uses `.includes()` on the other, inside the same
function — so the Set form is already the established local idiom, not a new
convention this PR introduces.
