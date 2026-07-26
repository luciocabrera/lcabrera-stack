# `src/benchmarks/` — measurement, not product code

## Why this directory exists

ADR-054 chose an array-operation hierarchy from a **synthetic** benchmark — the root
`vp run bench:array-ops` script, which arrives with #453 — measuring a `row => row.name`
projection behind an `index % 2` predicate. That is enough to rank the _shapes_ against each other and
not enough to decide anything about this package's code, because the real sites
differ in the two variables that matter most:

- **Predicate cost.** `AddSortSection` runs `sorting.every(…)` inside its filter,
  which is already `O(columns × sorting)`. `useAddFilterSection` calls
  `Object.hasOwn` per element. When the predicate dominates, the gap between one
  pass and two collapses, and a shape-level "2× faster" stops predicting anything.
- **What consumes the result.** `getStaticColumnKeys` feeds `new Set()`;
  `buildPresetColumnSizing` feeds `Object.fromEntries` over `as const` tuples.
  Those consumers can cost more than the traversal being optimised.

So these files measure the **real functions at the real sizes**, to decide whether
the findings accepted in `docs/agents/react-doctor-triage.md` deserve their
acceptance. Issue #454.

## Conventions that differ here, and why

`.bench.ts` files are **not product code** and deliberately do not follow two rules
that govern `src/`:

| Rule                                              | Why it does not apply                                                                                                                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One util per file + colocated test                | A benchmark is a measuring instrument; a test asserting its timings would be flaky by construction. Fixtures stay local to the file that uses them so the measured setup is visible at the point of measurement. |
| No named module-level helpers outside `*.util.ts` | Transcribed variants and fixture builders belong beside the benchmark they serve — splitting them across files would hide what is being compared.                                                                |

They are **outside the shipped surface**: nothing re-exports them, no barrel
references them, and `files` in `package.json` publishes `src` minus tests — so
verify with `vp run publish:verify` / `vp run api-surface:verify` after adding one,
and exclude the pattern if it ever starts shipping.

## How to run

```bash
vp run --filter @lcabrera/ui bench
```

Vitest's default `benchmark.include` matches `*.bench.ts` and its default test
`include` matches only `*.{test,spec}.*`, so `vp run test` does **not** pick these
up. Confirm that with the suite count after adding a file.

## Reading the output

Two things matter, in this order:

1. **Absolute per-call cost.** A 3× ratio on 40 ns is not a finding. Every
   conclusion drawn from these files must quote the absolute number.
2. **Whether the ordering changes with size.** A fused variant that wins only at
   10,000 elements is irrelevant to a 150-column ceiling.

Ratios alone have already misled once here: the synthetic benchmark's `flatMap`
result reverses at ~1,000,000 elements, which a ratio-only summary hid.

## Files

| File                   | Measures                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `arrayShapes.bench.ts` | The eight react-doctor sites accepted in the triage record — current implementation vs. a fused single-pass variant. |
| `fixedSites.bench.ts`  | The two sites #450 changed — pre-fix vs. post-fix, to confirm the fix was an improvement rather than a wash.         |
