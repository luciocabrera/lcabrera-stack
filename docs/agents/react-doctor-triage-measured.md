# POC findings — the flagged functions, measured

Companion to [`react-doctor-triage.md`](react-doctor-triage.md), which accepted eight
`js-combine-iterations` findings on **reasoned** grounds: collection bounds, call-path
coldness, and react-doctor's own exception criteria. This is the measurement of those same
sites, so each verdict rests on a number instead of an argument. Issue #454.

Run it yourself: `vp run --filter @lcabrera/ui bench`. Sources in
[`packages/ui/src/benchmarks/`](../../packages/ui/src/benchmarks/ARCHITECTURE.md).

## How to read this

**Absolute per-call cost first, ratio second.** A 3× ratio on 40 ns is not a finding. This
distinction did real work below: the `reorder-to-fill` site shows a 1.51× ratio that turns
out to be 300 nanoseconds, and one site shows a ~4× ratio that is genuinely worth having.

The reference size is **150 columns** — the deliberate `wide-alltypes-150` stress route.
Sizes above that appear only to locate crossovers.

## Headline: the synthetic benchmark understated the flatMap problem

ADR-054 measured `flatMap(x => cond ? [y] : [])` at roughly **2× slower** than
`.filter().map()` using a synthetic 50%-keep projection. Against the real
`resolvePrimaryKeyColumnKeys` it is far worse — **~3× slower at 10 columns and ~6.5× slower
at 150** — because the real predicate keeps _one_ column of 150. The idiom allocates a
throwaway array per element, so low selectivity is its worst case, and low selectivity is
exactly what this repo's filters do.

So the rule's warning holds on real code and is, if anything, too mild. This is also the
clearest demonstration of why the POC was worth running: the synthetic number was directionally
right and quantitatively misleading.

## Verdicts

### Confirmed — fusing does not help

| Site                            | Measured at n=150                                    | Verdict                                                                                                                                                                 |
| ------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolvePrimaryKeyColumnKeys`   | fused `reduce` saves **~26 ns/call**                 | Acceptance holds. Independently reproduces the ~20 ns figure the #449 audit used to reject the fusion fix — arrived at by a different method, which is the useful part. |
| `getStaticColumnKeys`           | `for...of`+`set.add` saves **~50 ns/call**           | Acceptance holds. Runs on mount and drawer-Apply.                                                                                                                       |
| `useAddFilterSection` options   | fused `reduce` is **1.14× SLOWER** (1.6 µs → 1.8 µs) | Acceptance holds, and strengthens: fusing this site would be a regression, not a wash.                                                                                  |
| `reorder-to-fill` order rebuild | fused saves **~300 ns/call** (0.9 µs → 0.6 µs)       | Acceptance holds. The 1.51× ratio is the trap; the absolute number is the answer.                                                                                       |
| `appendPrimaryKeySorting`       | operates on a 1-element primary-key list             | Acceptance holds by construction.                                                                                                                                       |
| `NotificationCenter` placements | fixed 4-element constant                             | Acceptance holds, and the shape is load-bearing for a documented linter conflict — do not touch regardless.                                                             |

### Confirmed with a caveat

**`AddSortSection` options** — fused `reduce` is ~1.4× faster (1.6 µs → 1.1 µs, so ~0.5 µs).
The triage argued the nested `sorting.every(…)` dominates and that a `Set` of sorted keys,
not fusing, would be the real optimization. Measured, the `Set` variant lands at ~1.2 µs —
**statistically level with the fused reduce**, not ahead of it. So the reasoning was right
that the `.map()` is not the cost, but wrong to imply the `Set` was the bigger lever at this
size. Both are ~0.5 µs on a drawer-open path. Acceptance holds on absolute grounds; neither
alternative is worth the churn.

### Overturned — the triage was wrong here

**`buildPresetColumnSizing`.** The record called this the coldest site with "zero measurable
gain". That is not true: a `reduce` writing straight into an object is **roughly 4× faster at
both 30 and 150 columns** — about 2.6 µs down to 0.7 µs, so **~2 µs per call** saved.

The reason the triage missed it is instructive. The cost is not the double pass the rule
flagged; it is `Object.fromEntries` over per-element `as const` tuples, which the fused
version skips entirely by assigning keys directly. So the rule pointed at real waste through
faulty reasoning, and the triage rebutted the reasoning without checking for the waste.

It is still 2 µs on a single click of a width-preset button, so this is a **candidate, not an
urgency** — and the three semantic traps the record documents (the `as const` tuple, the
`Object.fromEntries` consumer, and the truthiness filter that must keep dropping `width === 0`)
all still apply to any rewrite. Tracked as a follow-up rather than fixed here, because #454 is
scoped to measuring.

### The #450 fixes were real, and better than argued

| Site                                       | n=150                             | n=1000           |
| ------------------------------------------ | --------------------------------- | ---------------- |
| `unpin-beyond` (no-op `.filter()` deleted) | **3.84× faster**, 5.2 µs → 1.4 µs | **42.8× faster** |
| `move-column` (reuse `allOrderedKeys`)     | **1.40× faster**                  | 1.30× faster     |

The `unpin-beyond` curve is the removed `O(window × pinned)` `Array.includes` scan showing up
exactly where predicted — flat gain at small sizes, then divergence. At n=30 the pre-fix
version measures _ahead_ by 1.28×, which is the small-N noise floor and worth recording rather
than hiding: the win only becomes real from about 150 upward.

**What kind of win this is — state it per path, not per family.** Both sites here are reached
from `useAcceptPinConflict` / `useAcceptUnpinConflict`, i.e. a modal-accept **click**. So these
figures are a **scaling-correctness and click-cost** win, not a frame-time one: 42.8× multiplies
a sub-millisecond operation that runs once per user action. Do not quote them as a rendering fix.

That characterisation does **not** generalise to the whole `js-set-map-lookups` family, and
saying "not a frame-time win" as a blanket statement would be wrong. `resolveListDerivedState`
calls both `getFilteredOptions` and `getIsAllSelected` from `useSetSearchTerm` on **every
keystroke**, over a list that is virtualized precisely because it is large — and
`getIsAllSelected` is `filteredOptions.every((o) => selectedValues.includes(o))`, `O(n·m)` with
`m` growing to `n` after a Select All. That is typing latency, and it is the hottest site in the
family. Per-path, not one adjective for all of it.

## What this changes

1. **ADR-054's flatMap finding is confirmed and understated.** Its findings section should
   note the real-function figure alongside the synthetic one. Gated on #453, which still holds
   ADR-054.
2. **The triage record's `buildPresetColumnSizing` row is corrected** in this change.
3. **A follow-up should cover `buildPresetColumnSizing`** — the only overturned verdict.
4. **Method note for future triage:** every verdict here that survived did so on _absolute_
   cost, and the one that failed did so because nobody measured. Bounds-and-coldness reasoning
   was right 7 times out of 8 — good, but not a substitute for a number when the claim being
   written down is "zero measurable gain".

## Limitations

Worth stating so nobody over-reads this.

- **Three sites are transcriptions, not imports.** `AddSortSection`, `useAddFilterSection` and
  `NotificationCenter` build their arrays inline in a component or hook, so the benchmark
  copies the expression. A future edit to those components will not update the benchmark —
  check the transcription before trusting a re-run.
- **These measure the pure derivations, not React.** In production the two drawer sites sit
  behind React Compiler memoization on `[columns, filters]` / `[columns, sorting]`, so their
  real-world call frequency is lower than a benchmark implies. That makes the acceptances
  safer, not less safe.
- **Single machine, single Node version.** The orderings reproduced across runs; the absolute
  figures will not transfer. Re-run rather than quote.
- **No render-level profiling.** Every number here is dwarfed by one unnecessary re-render,
  which is the measurement that would actually rank these sites against real user-visible
  cost. Separate instrument, separate issue.
