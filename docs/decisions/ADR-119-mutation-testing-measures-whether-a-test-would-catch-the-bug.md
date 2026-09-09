---
governs:
  - repository
---

# ADR-119 — Mutation testing measures whether a test would catch the bug

**Status:** Accepted

**Date:** 2026-09-09

**Issue:** [#1147](https://github.com/luciocabrera/lcabrera-stack/issues/1147)

**Relates to:** [ADR-049](ADR-049-findings-reports-are-produced-on-demand.md) (report on demand, track only gate baselines), [`AGENTS.md`](../../AGENTS.md) §7 (verifying a claim), [`docs/agents/epic-orchestration.md`](../agents/epic-orchestration.md) §6

## Context

Every gate in this repository answers "did the tool run and find nothing". None
of them answers "would the suite have noticed if the code were wrong". That is
the gap `AGENTS.md` §7 names: _a rule that never loaded and code that is correct
produce identical output_. The reviewer contract already applies the reasoning to
gates — a reviewer plants a deliberate violation before certifying one — but
nothing applies it to the tests themselves.

Coverage does not close it. Coverage proves a line executed; it says nothing
about whether an assertion depends on the result. Two survivors found by hand in
`packages/utils` had **100% line coverage**:

- `parsePositiveInteger`'s `>= 0` could be widened to `>= -1` with every test
  green, because the negative case tested `'-5'` and nothing near the boundary.
- Its `Number.isSafeInteger` could be swapped for `Number.isInteger` unnoticed,
  because no test exceeded `MAX_SAFE_INTEGER`. That guard is load-bearing: the
  input is an untrusted string.

The pilot then found a third by itself, which is the clearer argument. In
`is-object.util.test.ts` the block named `it('returns false for null')` asserted
on `undefined`. `typeof null === 'object'` is the entire reason the `value !==
null` guard exists, and `null` is the only input that discriminates — so the
guard could be deleted and the suite named after it would stay green.

## Options considered

**Raise coverage thresholds.** Cheapest, and it measures the wrong thing. All
three defects above sat at full line coverage; a higher threshold would not have
moved.

**Property-based testing.** Genuinely complementary and it would have caught the
boundary cases. It does not report which existing assertions are load-bearing,
which is the question here, and it is a per-suite authoring cost rather than a
measurement.

**Mutation testing.** Answers exactly the question, produces a per-mutant list a
reader can act on, and needs no new test-authoring convention.

## Decision

**Adopt Stryker, scoped to `packages/utils`, as an on-demand report — not a
gate.**

`vp run mutation:report` writes `reports/mutation/full-latest.json`, is
gitignored, and never fails a build (`thresholds.break: null`), per ADR-049.

**Use Stryker's `command` runner, not `vitest-runner`.** `vite` resolves to
`@voidzero-dev/vite-plus-core` and `vitest` is 4.x;
`@stryker-mutator/vitest-runner` drives Vitest through internals that this
combination is not known to satisfy. The command runner invokes this
repository's own `test` task — `vp run test`, the task itself and not a copy of
the string it expands to — so a mutant faces exactly the suite CI runs, the two
cannot drift apart, and there is no integration surface to break. It costs a full suite run per mutant
and forfeits per-test filtering, and invoking the task rather than the raw runner
adds Vite+'s own startup to every mutant. For `packages/utils` — pure functions,
no DOM, no I/O — the suite is small enough that this is still a few minutes for
the whole workspace, which is worth paying to keep the command in one place.
Revisit only with a measurement showing the cost matters.

**`packages/utils` first, and only.** Pure, dependency-free, heavily depended
upon, and the place a false-green test is most expensive. Widening is a separate
decision with its own runtime evidence.

## Consequences

`vp run mutation:report` produces the score and the survivor list; this record
does not repeat either, per `AGENTS.md` §7. The measurement taken when this was
adopted is in the pull request, which is dated.

**A survivor is a finding, not a defect.** Some are equivalent mutants: code
whose change cannot alter observable behaviour, so no test can kill them and the
score can never reach 100%. Known examples, both in the baseline run: in
`safeJsonParse`, `raw === ''` can be replaced by anything, because `''`
then reaches `JSON.parse('')`, which throws into the same `catch` that returns
`undefined`. `parsePositiveInteger`'s `value === undefined` guard is the same
shape: `Number(undefined)` is `NaN` and fails `isSafeInteger` anyway. That
mutant surviving is a true report that the guard is redundant for correctness.

**This is why a future gate must fail on new survivors against a tracked
baseline, never on a score.** A percentage falls when someone adds well-tested
code carrying an unavoidable equivalent mutant, which charges the cost to the
wrong author.

**The run must be pinned to be reproducible, and this is the trap.** Stryker
sizes its runner pool to the machine, and with the command runner every slot is
a full Node + Vite process. Left at the default, the pool saturates the box and
mutants start recording **Timeout** instead of their real verdict — two mutants
that are cleanly killed when their file is mutated alone came back as timeouts in
a whole-workspace run, and the total swung by an order of magnitude between two
runs of identical code. A timeout scores as detected, so this moves the score in
the _safe_ direction and leaves no failure to notice. `concurrency` and
`timeoutMS` are therefore load-bearing configuration, not tuning: without them
the baseline drifts with machine load, and a gate diffing against a drifting
baseline fails people for someone else's CPU. Any change to either invalidates
the baseline and requires a fresh one.

**What the number is worth is bounded by one check.** A mutation score is only
evidence if a weakening moves it. Deleting the `value: '0'` assertion from
`parse-positive-integer.util.test.ts` leaves the suite green — coverage sees
nothing — while the file's score drops and `>= 0` → `> 0` flips to survived. That
is the same discrimination proof `lint:eslint:verify` performs for the eslint
pass, and it is the check to repeat before trusting any gate built on this.

## Alternatives considered

**Gate now, in CI.** Rejected until the report has run against real pull requests
for a while. A gate whose baseline nobody has read yet fails the wrong people,
and ADR-049 already separates a findings report from a gate baseline.

**Mutate the whole repository.** `packages/ui` is by far the largest workspace
and carries a browser-environment suite; a full-suite-per-mutant runner there is
not viable,
and per-test filtering is the thing this runner choice gives up.

## References

- Design for the eventual gate: scope by changed files via
  [`scripts/changed-files.sh`](../../scripts/changed-files.sh) — it resolves the
  merge base and **fails closed**, the trap that once let three required checks
  report green having checked nothing. Fail only on a survivor in a changed file
  absent from a tracked `reports/mutation/baselines/utils.json`, the shape
  `fallow audit --gate new-only` already uses.
