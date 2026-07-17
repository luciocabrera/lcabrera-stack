---
name: quality-gate-workflow
description: Post-change validation workflow for Vite+ projects. Use when finishing any code change, when validating work before a PR or merge, or when a change needs formatting, linting, type-safety, and test verification before being considered done.
user-invocable: true
allowed-tools: Bash(vp:*)
---

# Quality Gate Workflow

This skill defines the mandatory validation sequence after code changes.

## When to Apply

- After any code change (feature, refactor, bugfix)
- Before opening or updating a PR
- Before merge
- During regression triage when behavior changed unexpectedly

## References

| Reference                      | Use When                                                                   |
| ------------------------------ | -------------------------------------------------------------------------- |
| `references/daily-practice.md` | Running the quality gate quickly and consistently during daily development |

## Canonical Gate Order

> **Run from `apps/react-router/`** — not the monorepo root. Commands like `vp run test` and `vp check` must execute from the app directory, not the workspace root.

1. `vp fmt .`
2. `vp lint .` — Oxlint
3. `vp run lint:eslint:check` — the eslint custom-rules pass (`--fix` variant: `vp run lint:eslint`)
4. `vp check` — fmt + Oxlint + the **tsgolint** type pass
5. `vp run typecheck` — the real **tsc** pass (plus `check:public-api` in `packages/ui`)
6. `vp run test`

Use this exact order because each stage catches issues earlier/cheaper than the next.

**Stage 3 is not optional and is not covered by stage 4.** `vp check` is Vite+'s
built-in fmt + **Oxlint** + tsgolint; it does not know about the per-workspace
eslint pass. Every eslint-only rule set lives behind stage 3 — `perfectionist`
import/module ordering, the react/stylex rule sets, and `local-rules`. Running
only `vp lint .` will report clean on code that fails CI, which now runs
`vp run -r lint:eslint:check` as its own step.

**Stage 5 is not optional and is not covered by stage 4 either.** Stage 4's type
pass is tsgolint — Oxlint's type-aware path. It does read each workspace's own
strict `tsconfig.app.json`, so it is a genuine type-check, but it is not `tsc`
and it never runs the workspace's `typecheck` script. That script is where
`packages/ui` enforces `check:public-api` (its guard against server-only `node:*`
imports reaching the public API) and where the React Router apps regenerate route
types before checking. CI runs `vp run typecheck:all` as its own step in
`check-safe.yml`. From the root, `vp run typecheck:all` covers all 16 workspaces
in dependency order.

Shortcut: `vp run lint` in a workspace chains `vp lint . --fix` **and**
`vp run lint:eslint` (autofix for both), which is usually what you want while
iterating. `vp run lint:all` does the same from the root.

## Non-Negotiable Rules

- Do not skip a stage.
- Fix failures before moving forward.
- Re-run the full gate after non-trivial fixes.
- Prefer `vp run test` (not `vp test`) in this project.
- Never silence a finding to get a stage green (CLAUDE.md rule 11) — fix the code.

## Further Documentation

See `references/daily-practice.md` for command intent, failure triage, and time-saving loops.
