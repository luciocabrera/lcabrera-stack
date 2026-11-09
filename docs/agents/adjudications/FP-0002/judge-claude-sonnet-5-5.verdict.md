REAL

Evidence:

- The case file reports `VirtualSelect` at cognitive complexity 16, with `exceeded: "cognitive"`. The default limit is 15, as `docs/tooling/fallow-summary.md` states.
- `.fallowrc.json` sets no `maxCognitive` for the `health` section as a whole. None of its `thresholdOverrides` covers `packages/ui/src/components/VirtualSelect/`. They cover tests, repo-standards scripts and eslint-local-rules only. The default limit therefore applies to this file.
- I read `VirtualSelect.component.tsx`. The function is a 17-property destructured parameter with 5 default values, one hook call, one ternary and one JSX tree. The score is mostly default-value branching plus a large prop surface. That makes it a borderline, mildly inflated measurement, but the rule is working as defined and the value is over the limit.
- ADR-032 says to read `exceeded`. A `cognitive` finding is real complexity, not a coverage artifact like `crap`-only findings.
- The evidence is balanced at best, and the instructions say to rule REAL in that case.

Fix: In `VirtualSelect.component.tsx`, remove the inline destructuring defaults from the `VirtualSelect` signature. They are `isAlwaysOpen = false`, `isBusy = false`, `isDisabled = false`, `options = []`, `placeholder = 'Select...'` and `shouldFillHeight = false`.

1. Take `props: VirtualSelectProps` instead.
2. Let `useVirtualSelect` apply the defaults for `isAlwaysOpen`, `isBusy`, `isDisabled` and `options`, and return the resolved values.
3. Apply `placeholder` and `shouldFillHeight` in the hook too, or in a small `resolveVirtualSelectProps(props)` helper in `./hooks`. Either way the component body no longer carries the default branching.
4. Move the `shouldFillHeight ? styles.containerFill : undefined` ternary into a helper, or into the hook's return value as a `containerStyle`.
5. Re-run fallow to confirm the score is at or below 15.

Do not add a suppression comment. That would hide the finding without changing the code.
