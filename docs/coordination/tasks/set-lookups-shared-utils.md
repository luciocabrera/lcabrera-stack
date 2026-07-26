---
id: set-lookups-shared-utils
title: Replace array-scan lookups with Sets in the shared Table/VirtualList/VirtualSelect utils
owner: agent:claude
status: review
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

- Current step: all fifteen findings fixed, full gate green — in review
- Blockers: none
- Next: land, so `colorder-set-lookups` (#462) can rebase onto the helper

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
helper. This PR settles which helper exists, which is why the ordering matters
rather than being a preference.

**Resolved: the partition helper already existed, and neither of us had found
it.** `Table/utils/splitColumnsByPinning.util.ts` does exactly the three-way
left/center/right split, is already `Set`-based, and predates both claims. So
`getEffectiveColumns` now _calls_ it instead of re-filtering three times, and no
new abstraction was invented for that shape. Its return keys
(`centerCols`/`leftPinnedCols`/`rightPinnedCols`) are **not** renameable — they
are part of `Table.types.ts` and reach roughly thirty consumers — which is also
why a generic `getKey`-parameterised version was rejected: the payoff would be
one call site, against a public type change.

Only the **ordering** shape needed extracting: `orderColumnsByKeys.util.ts`,
alongside `splitColumnsByPinning` at the same granularity.

**The two ordering sites do not share semantics — check before reusing.**
`orderColumnsByKeys` drops an order entry with no matching column (it inherits
`columnOrder.map(find).filter(Boolean)`). `buildOrderBySorting` in
ColumnOrderSection does not: `[...sortedKeys, ...columnOrder.filter(...)]` emits
a sorted key that is absent from `columnOrder`.

What that key then does depends on whether it is static, which is the part worth
knowing before reusing anything. Established by #462's owner by running the real
function, not by reading it:

| sorted key absent from `columnOrder` | today            |
| ------------------------------------ | ---------------- |
| not static                           | survives         |
| not static, another column is static | survives         |
| static                               | silently dropped |

`restoreStaticColumnOrder` filters every static key out of `newOrder` and
re-inserts only those with an index in `currentOrder`; a static key with no such
index has nowhere to return to. So the current behaviour is not "keeps unknown
keys" — it keeps non-static ones and drops static ones, a split nobody chose and
no test covers either side of.

That inverts the framing this file carried first. Adopting `orderColumnsByKeys`
there would drop all unknown keys uniformly, which removes the inconsistency
rather than introducing a change — so the question is "keep an inconsistency or
remove it", not "keep or change". Still #462's call, and still needs a test
whichever way it goes.

**Measured, because a helper can eat the win it exists to deliver.** Method: a
standalone script replicating all three variants verbatim and timing each over
`process.hrtime.bigint()` with a warmup pass — not the real imports, because at
the time of measuring, the benchmark harness #455 adds was not yet on `main` and
the directory it lives in is #454's claim. Single run, one machine, so treat the
ratios rather than the absolute times as the result:

- `getEffectiveColumns` at 1000 columns — old 1.559 ms, new via the two helpers
  0.130 ms, new fully inlined 0.118 ms. The indirection costs ~9% of the
  improved time against ~1.43 ms saved, so the extraction is not what to
  optimise. At 150 columns it is 2.6×; at 50, 1.7×.
- `getIsAllSelected` at 5000 options with Select All active — 12.88 ms → 0.148 ms
  (**87×**), and that is per keystroke. At 500 options, 17×.

All three `getEffectiveColumns` variants were asserted to produce identical
output in the same script.

**Overlap with `real-array-bench-poc` (#454)** is real but narrow: its area is
`packages/ui/src/**/*.bench.ts`, which intersects these directories only on bench
files. Nothing here edits a `*.bench.ts`.

An earlier revision of this file guessed that #455 would need a re-run once this
landed. It does not, and the guess is recorded here only because it was acted on:
its bench files import nothing from these utils — a type-only import plus `bench`
and `describe` from `vite-plus/test` — and they measure #450's before/after
through inlined replications. Both halves of this work independently arrived at
self-contained replication rather than importing the real functions, for the same
reason: neither branch can import from the other before it merges.

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
