---
governs:
  - repository
---

# ADR-135 — Lint evals/ from a root eslint config rather than making it a workspace

**Status:** Accepted

**Issue:** [#1345](https://github.com/luciocabrera/lcabrera-stack/issues/1345)

## Context

The eslint pass runs per workspace: each workspace has an `eslint.config.mjs`
and a `lint:eslint:check` script, and the gate is `vp run -r lint:eslint:check`.
`evals/` holds the eval runners and their tests, and it is not a workspace. Its
tests already needed their own root script, `test:evals`, for the same reason.
Oxlint reaches `evals/` because it runs once from the root, but perfectionist,
the `local-rules` and the unicorn rules configured in eslint did not run there,
and a misordered import planted in `evals/` passed every gate.

`vp run -r` includes the workspace root package as well as the workspaces, so a
root script named `lint:eslint:check` joins the existing gate step in
`check:safe`, `check:push` and `check-safe.yml` without a change to any of them.

## Decision

The root carries the eslint pass for `evals/`:

- The root `eslint.config.mjs` calls `createBaseCustomRulesLintConfig` and adds
  the global ignores `*` and `!evals/`. ESLint resolves the nearest config
  above a file, so a file outside every workspace that is not under `evals/`,
  such as one under root `scripts/`, finds this config and is ignored by it.
- The root `lint:eslint:check` script lints `evals` by name. If a later change
  to the config ignored `evals/` as well, ESLint stops with "all of the files
  matching the glob pattern are ignored" rather than passing over no files.
- The runners are commands a developer runs over paths and text from the
  repository and the command line, so they get the same tooling-script block as
  files under `scripts/`. The root config names them with the factory's
  `toolingScriptPatterns` option.
- Every other finding is fixed in the code. Nothing under `evals/` is
  suppressed.

## Consequences

- The gate step that was already there now lints `evals/`, and so does
  `vp run lint:all`. The pre-commit hook lints a staged `evals/` file through
  the root config, where before it found no config and skipped the file.
- The root manifest declares `eslint`, which it did not need before.
- The tooling-script block switches off `unicorn/no-null` and three `security/*`
  rules for every file under `evals/`. That is correct while the runners only
  read the repository. If one of them starts handling input from outside it,
  the pattern has to narrow.
- `vp run lint:eslint:verify` does not probe the root pass. Its probe file is
  written to a fresh directory at the root of a workspace, which this config
  ignores. The fail-closed target above covers a pass that lints no files, but
  not a pass that runs and reports nothing.

## Alternatives considered

- **Make `evals/` a workspace.** Rejected: a new workspace also needs a
  generated tsconfig entry, a `typecheck` script, a place in the workspace
  roster that `commands:verify` counts, and its own dependency declarations.
  None of that is needed to lint the directory. It would also move
  `test:evals` into the `-r test` fan-out, which is a separate change.
- **Turn the four rules off for `evals/**` in the root config.** Rejected: that
  is the tooling-script block written out a second time, and the two copies
  would drift apart. Naming the directory through the factory option keeps one
  definition.
- **Rewrite the code to satisfy `unicorn/no-null`.** Rejected: the run envelope
  schema declares absent values as `null`, so replacing them with `undefined`
  changes what a runner writes.

## References

- [#1342](https://github.com/luciocabrera/lcabrera-stack/pull/1342), where the
  missing pass was found
- [`lint-toolchain` skill](../../.github/skills/lint-toolchain/SKILL.md)
