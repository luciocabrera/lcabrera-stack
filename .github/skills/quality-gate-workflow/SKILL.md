---
name: quality-gate-workflow
description: Post-change validation workflow for Vite+ projects. Use after every code change to enforce formatting, linting, type safety, and test correctness before considering work done.
user-invocable: true
license: MIT
metadata:
  version: '1.0.0'
  scope: [root]
  auto_invoke: 'After completing any code change — run before considering work done, before opening a PR, or before merge'
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
2. `vp lint .`
3. `vp check`
4. `vp run test`

Use this exact order because each stage catches issues earlier/cheaper than the next.

## Non-Negotiable Rules

- Do not skip a stage.
- Fix failures before moving forward.
- Re-run the full gate after non-trivial fixes.
- Prefer `vp run test` (not `vp test`) in this project.

## Further Documentation

See `references/daily-practice.md` for command intent, failure triage, and time-saving loops.
