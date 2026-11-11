---
governs:
  - repo-standards
---

# ADR-149 — The mutation gate type-checks surviving mutants

**Status:** Accepted

**Date:** 2026-11-11

**Issue:** [#1624](https://github.com/luciocabrera/lcabrera-stack/issues/1624)

**Amends:** [ADR-119](ADR-119-mutation-testing-measures-whether-a-test-would-catch-the-bug.md). It said some survivors are equivalent mutants and the score can then never reach 100%. This takes out the subset a tool can prove: mutants that do not compile. Nothing else in ADR-119 changes.

## Context

`repo-fallow-gate mutation` runs `fallow mutation --min-score 100` on the changed code. fallow mutates source text and runs the tests, so it can produce a program the type checker rejects. A mutant of that kind survives whenever the tests do not notice, and no test can notice it, because the program it stands for never gets past `vp run typecheck:all`.

The case that forced this was a key roster typed `Record<keyof T, true>`, read only for its keys. The mutant `true` → `false` survived in two files, and `false` is not assignable to `true`. The gate failed a change whose tests caught every mutant that could exist.

The false-positive panel (ADR-147) was not a route: `vp run adjudicate` matches a fallow finding through fallow's issue registry, which has no mutation entry, and a survivor has no suppression marker to pair with a list entry.

## Options considered

1. **Pass `--typecheck` to `fallow mutation`.** fallow type-checks each survivor through its type-aware companion; one that does not type-check becomes `compile_error` and leaves the score. Chosen.
2. **Extend the panel to mutation survivors**, writing dismissals into a `--verdicts` file. It would let a person or a panel remove a mutant the tests could kill, and a mutant has no marker in the code for a reader to see. It adds discretion where a mechanical check answers the question. Rejected for this class of survivor; it stays open for an equivalent mutant that does compile.
3. **Rewrite the code so the mutant compiles and dies.** It shapes correct code around the tool, which ADR-147 names as the failure it exists to prevent. Rejected.

## Decision

`mutationArgs` in `packages/repo-standards/scripts/fallow-gate.mjs` includes `--typecheck`. `fallow-gate.test.mjs` and `fallow-gate-mutation.test.mjs` pin the argument list. `--min-score 100` is unchanged.

## Consequences

- A survivor that does not type-check no longer fails the gate. Nothing a person decides takes it out; the type checker does.
- A survivor that does type-check fails the gate exactly as before. The pull request for #1624 records a planted untested branch that still fails it.
- The run is slower by the time fallow spends type-checking survivors. The cost scales with survivors, not with mutants, so a well-tested change pays little.
- The check depends on fallow's type-aware companion loading each workspace's TypeScript setup. That was checked for `packages/ui` only; how fallow reports a workspace the companion cannot load was not tested.
- Equivalent mutants that compile still fail the gate. ADR-119's note on them still holds.

## References

- [#1624](https://github.com/luciocabrera/lcabrera-stack/issues/1624), [#1623](https://github.com/luciocabrera/lcabrera-stack/pull/1623)
- `fallow mutation --help`, `--typecheck`
