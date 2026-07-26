# ADR-054 — An array-operation hierarchy chosen by intent, and measured

- **Status:** Accepted
- **Date:** 2026-07-26
- **Scope:** repo-wide TypeScript conventions; `.claude/rules/typescript.md`
- **Supersedes:** the two absolute lines this replaces in
  `.claude/rules/typescript.md` ("Never mutate data" / "Use functional array operations
  exclusively. No imperative `for` loops for data transformations")
- **Issue:** #452

## Context

The array-operation guidance was two sentences, and each caused a distinct problem.

**It omitted `.flatMap()`.** The one method whose actual purpose is 1-to-many and
flattening was absent from the list a reader is told to choose from, while the codebase
already used it correctly for recursive flattening (`flattenFields.util.ts`,
`collectAccessors.util.ts`, `to-query-filters.util.ts`).

**The `for...of` ban did not describe the code.** `for (const … of …)` appears in
non-test `packages/ui/src` many times over, and several instances are plainly data
transformations — `getNormalizedColumns`, `pinAllBetween`, `getPinnedColumnOffsets`,
`inferTableColumnsFromJson`, `groupNotificationsByPlacement`. Nothing enforced the ban.
A rule the code contradicts that many times is not a standard, and it degrades the
credibility of the rules around it — the same failure AGENTS.md §4 names when it says a
rule nobody can comply with gets ignored wholesale. Verify the current state with
`grep -rn "for (const" packages/ui/src --include=*.ts --include=*.tsx | grep -v test`,
not with a count written here.

**"Never mutate data", stated absolutely, made `reduce()` unwritable.** Biome's
`noAccumulatingSpread` (ADR-035) forbids `[...acc, item]`, which leaves `acc.push(item)`
as the only available reduce shape — and that reads as a violation of an absolute
no-mutation rule. So the honest reading of the rules left _no_ legal single-pass fold.

This surfaced concretely during the react-doctor triage (#449): the wording pushed the
analysis into calling a correct `reduce()`+push fix a "policy cost", and into treating
`flatMap` as the sanctioned alternative.

## Decision

Replace the two absolute sentences with a table keyed by **intent**, and scope the
mutation rule to what it actually protects.

1. **`.map()`** for 1-to-1, **`.filter()`** for selection, **`.flatMap()`** for
   1-to-many/flattening, **`.reduce()`** for folds.
2. **`.filter().map()` is the default** for select-and-transform. Fusing it is a hot-path
   optimization to apply on evidence, not a style preference.
3. **`.reduce()` into a locally-allocated accumulator is explicitly legal**, `push` and
   all. "Never mutate" now reads "never mutate anything you did not create in the current
   function" — arguments, props, captured state, store state.
4. **`for...of` is permitted** for early exit, several outputs in one traversal, building
   a `Map`/`Set`, and side effects over a collection. A manual index loop re-implementing
   `.map()`/`.filter()` remains banned.
5. **`flatMap(x => cond ? [y] : [])` is explicitly called out as a pessimization**, not
   an optimization.

## Why — the measurement

react-doctor's `js-combine-iterations` rule prescribes `.flatMap()`, `.reduce()` or
`for...of` for a `.filter().map()` chain, and describes the flatMap form as eliminating
"both the intermediate allocation and the second full traversal". That is false for the
wrapping idiom, and the error is not subtle: `[y]` allocates **one array per element**,
where the chain it replaces allocates **two in total**.

**Method** (re-run it rather than trusting numbers): benchmark five shapes —
`.filter().map()`, `.map().filter()`, `.flatMap()` wrapping, `.reduce()`+push, and
`for...of`+push — over N from 100 to 1,000,000, at both a 50% and a 2% keep rate, taking
the **median of several runs after warmup** and **consuming each result** so the JIT
cannot dead-code the work. Two selectivities matter because the repo's real case keeps
1–2 of 150; a conclusion that only holds at 50% would not transfer.

**Findings, as orderings rather than timings** (run `node scripts/bench-array-operations.mjs`
for figures):

- **`flatMap` wrapping is the slowest shape from 100 up to 100,000 elements**, including
  slower than the `.filter().map()` chain it is supposed to optimize — by roughly a factor
  of two. The per-element allocation dominates.
- **It reverses at about a million elements with a high keep rate**, where `flatMap` edges
  _ahead_ of the chain by around a tenth: two million-element intermediates finally cost
  more than a million pieces of short-lived garbage. At the same size with a 2% keep rate
  it is slower again. So the honest claim is bounded — "flatMap is always slower" would be
  false, and the reversal is reproducible, not noise.
  **This does not license the idiom here**: no UI path in this repo approaches that size
  (the grid virtualizes, and the column ceiling is 150), so within the range that exists
  the chain wins.
- **`.reduce()`+push and `for...of`+push are tied at every size**, within a few percent
  and with the order between them varying run to run. This is the load-bearing result: the
  fastest available shape is reachable _with an array method_, so banning `for...of` never
  bought throughput.
- `.filter().map()` sits within a small constant factor of the fastest shapes; at the sizes
  this repo handles the absolute difference is sub-microsecond.
- `.map().filter()` is worse than `.filter().map()` in nearly every configuration, and the
  gap widens as the filter gets more selective — the map is doing work on elements that are
  about to be discarded. It is faster only in the smallest, least selective case measured.
  Prefer filtering first.

**Confirmed against this repo's own functions, and the synthetic figure is the
conservative end.** Issue #454 re-ran the flatMap comparison against
`resolvePrimaryKeyColumnKeys` instead of a synthetic projection, and the ordering held
with a **wider** margin at every size tried. The reason is selectivity: that predicate
keeps one column of 150, and the wrapping idiom allocates a throwaway array per element
whether or not the element survives, so a low keep rate is its worst case — and a low keep
rate is what this repo's filters actually do. Reproduce with
`vp run --filter @lcabrera/ui bench`; the per-site verdicts live in the measured-triage
record under `docs/agents/`.

The second finding is what changes the rule's shape. The case for relaxing the `for...of`
ban is **clarity** — partitioning, early exit, `Map` building — and explicitly _not_
speed. Stating that matters, because "use a loop, it's faster" would otherwise become
folklore justified by this ADR.

## Consequences

**Good.** The rules describe the code, so the existing `for...of` sites are compliant
rather than silent debt. `reduce` has a legal spelling. `flatMap` is documented for what
it is for, and documented as _not_ the fused-filter-map trick — which is the specific
mistake an agent following react-doctor's own advice would otherwise make. Immutability is
stated as the property that matters (nothing you don't own gets mutated) instead of a
slogan that forbids a safe local write.

**Costs and risks.** The guidance is longer than two sentences; a table is the price of
being right about each distinct situation instead of one of them. Relaxing the `for...of` ban risks drift toward
imperative style — mitigated by the allow-list being specific, and by keeping the manual
index loop banned. Nothing here is lint-enforced, so it relies on review; a
`no-wrapping-flatmap` rule is plausible future work but needs its own false-positive
measurement before it earns a place in the gate.

**Deliberately not done.** No existing code is rewritten. This ADR makes the rule
describe reality; migrating the `for...of` sites would be churn, and most of them are the
clearer choice under the new table anyway.

## Alternatives considered

**Keep the absolute ban and rewrite the offending sites.** Rejected: it would be a large
diff across `packages/ui` making several utilities _less_ clear (`getPinnedColumnOffsets`
and `inferTableColumnsFromJson` are genuinely nicer as loops), to satisfy a rule with no
measured benefit — the tie between `reduce`+push and `for...of` means the ban buys no
speed.

**Adopt `flatMap` as the standard fused filter+map, as react-doctor suggests.** Rejected
on measurement. It would slow down every site it touched while presenting as an
optimization, which is worse than leaving the chains alone.

**Add a "performance ceiling" above which imperative loops are allowed** (the framing
that prompted this ADR — e.g. "over 100,000 items, use a `for` loop"). Rejected as
written, for two reasons. The threshold is unmeasurable in review, and more importantly
the premise does not hold: `reduce()`+push already matches `for...of` at every size, so no
ceiling is needed to reach the fast path. The real distinction is _intent_, which is what
the table encodes. Note also that this repo's UI ceiling is a virtualized grid — 150
columns and a few dozen visible rows — so the 100,000-item scenario belongs to
`packages/server` / `scan-ingestion`, where the same table applies unchanged.

## References

- #452 — this change; #449 — the triage that exposed the wording problem; #451 — the
  per-row derivation follow-up
- `docs/agents/react-doctor-triage.md` — defers to the rule for shape selection
- [ADR-035](ADR-035-biome-third-linter.md) — `noAccumulatingSpread`, which forces the
  `push` shape
- `apps/react-router/docs/decisions/ADR-004-react-compiler.md` — correctness over hand
  optimization, the principle this table serves
