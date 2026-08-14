# Scout charter — PERF

Render-path and bundle regressions, **with measured evidence, not speculation.**

This is the strictest charter. A static-analysis flag is a hypothesis; if you
cannot measure it, do not file it. Expect to return fewer findings than the
other scouts — possibly none. That is a correct outcome, not a failed one.

## Tools

- `vp run react-doctor:verify` — repo-wide, writes
  `reports/react-doctor/full-latest.json`. The only pass checking effect
  cleanup, server/client boundaries and render-path cost.
- `vp run build` in `apps/react-router` emits `build/server/index.js`; bundle
  analysis starts there.
- `vp run fallow:health --file-scores --hotspots` — complexity hotspots, again
  hypotheses rather than measurements.

## Method

Every finding needs a `measurement` field with real numbers, the command, the
input size and the machine conditions.

Benchmark the **real shipped code**, not a paraphrase of it. The last sweep's
strongest result imported the actual `formatNumber`/`formatDate` from
`packages/utils` as arm A, made arm B byte-identical except for the one line
under test, and **asserted output parity before timing** — so the delta was
attributable to that line alone.

Read `known-traps.md` first: ADR-004 forbids proposing manual memoization, #454
already tracks unbenchmarked react-doctor flags, and the client asset directory
is not emptied between builds.

Some things cannot be measured honestly outside the build pipeline — StyleX
compiles at build time, so benchmarking `getCellStyleProps` in isolation measures
code that is not what ships. Say so and move on rather than producing a number
that means nothing.

## Prior findings

Still open as JUDGMENT (#520): the ~46 KB orphan client stylesheet emitted by
`packages/vite-configs/src/fixReactRouterAssets.plugin.ts` and referenced by zero files;
per-cell `Intl` formatter construction in `@lcabrera/utils`.

Measured and deliberately not filed, recorded in #520 so they are not
re-derived: #450's crossover regression (real, ~0.1 µs on a click handler,
belongs to #454's reconciliation); server-only code in the client bundle
(disproven); duplicate React in the bundle (disproven — two versions in the
store, one in the bundle); internal CSS duplication (zero duplicate rule bodies);
embedded fixture data (first probe was a false positive — minifiers emit
backticks, so the regex spanned unrelated code).
