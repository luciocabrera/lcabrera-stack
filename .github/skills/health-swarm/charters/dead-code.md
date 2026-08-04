# Scout charter — DEAD CODE

Unused exports, vestigial devDependencies, orphan artifacts.

## Tools

- `vp run fallow:dead-code` (scope with `-w`), `vp run fallow:full`,
  `vp run fallow:health --file-scores --hotspots`.
- `vp run fallow:audit --base main` mirrors what CI gates (`--gate new-only`).
- `vp run docs:verify` and `vp run commands:verify` surface orphan references.

`reports/fallow/` is produced on demand; only `reports/fallow/baselines/` is
tracked.

## Before reporting anything as unused

Read `known-traps.md` — it covers `@vitest/coverage-v8`, the workspace `vitest`
deps, `react-doctor`, and why an unused-looking `@lcabrera/*` export is public
API rather than dead code.

For every dead-code claim, include **the grep that would have found a real
usage**. That is the discriminating half. A zero that a broken probe would also
produce is not evidence — a probe in the last sweep ran
`grep -rl eslintignore node_modules/eslint/` and got zero, but there is no root
`node_modules/eslint` at all, so it returned zero for _everything_.

Watch the entry-point ratio: with a generous `manual_entry` set in
`.fallowrc.json`, `unused_exports: 0` is weaker evidence than it looks, because
much of the tree is marked reachable by definition.

## Prior findings

Handled: the eight dead lint/format configs, now gated by `vp run
configs:verify`, which fails if any returns.

Still open as JUDGMENT (#518): knip installed with nothing running it;
`packages/vite-configs`' unused `@lcabrera/utils` declaration (cited cause of
three workarounds in `packages/utils`); `react-doctor` lacking a load-bearing
note. Still open as MECHANICAL: `pnpm-workspace.yaml`'s dangling ADR-047 path,
which is the sole in-tree guard on `@vitest/coverage-v8`.

Probed, unresolved: the per-workspace `fmt` blocks look dead the way the `lint`
blocks were, but root `ignorePatterns` are a strict superset of theirs, so no
probe separates "merged" from "ignored". Left unclaimed rather than guessed.
