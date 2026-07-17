---
title: Quality Gate Daily Practice
description: Practical workflow that bridges project quality requirements to daily coding operations
tags: [quality, lint, typecheck, tests, vite-plus, workflow]
---

# Quality Gate Daily Practice

## Overview

Run the quality gate after every change set so correctness and maintainability drift is caught immediately.

## The Gate

```bash
vp fmt .
vp lint .
vp run lint:eslint:check
vp check
vp run typecheck
vp run test
```

## Why This Order

| Step | Command                    | What It Catches                                           | Why First/Next                                            |
| ---- | -------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| 1    | `vp fmt .`                 | formatting drift                                          | cheapest auto-fix pass                                    |
| 2    | `vp lint .`                | rule violations, unsafe patterns, architecture guardrails | avoids type/test noise from known lint failures           |
| 3    | `vp run lint:eslint:check` | import/module order, react/stylex rules, `local-rules`    | eslint-only rule sets no other stage runs                 |
| 4    | `vp check`                 | fmt + Oxlint + the tsgolint type pass                     | verifies structural correctness before runtime assertions |
| 5    | `vp run typecheck`         | real `tsc`; `check:public-api` in `packages/ui`           | the reference type-check the tsgolint pass approximates   |
| 6    | `vp run test`              | behavioral regressions                                    | highest-cost stage, run after static checks pass          |

Steps 4 and 5 are **different passes, not a retry**. Stage 4's types come from
tsgolint (Oxlint's type-aware path reading each workspace's `tsconfig.app.json`);
stage 5 is the actual compiler, and it is the only stage that runs the
workspace's `typecheck` script — where `packages/ui` gates its public API against
server-only `node:*` imports and the React Router apps regenerate route types.

## Fast Local Loop (While Building)

Use an incremental loop while coding, then full gate before completion.

1. Make focused change.
2. Run `vp lint .` for fast feedback.
3. If types affected, run `vp check`.
4. Once scope is complete, run full gate.

## Failure Handling Playbook

| Failure Stage      | Action                                                                    |
| ------------------ | ------------------------------------------------------------------------- |
| `fmt` failed       | re-run `vp fmt .`, inspect changed files                                  |
| `lint` failed      | fix root cause (avoid suppressions unless justified)                      |
| `check` failed     | resolve types at source boundary, avoid widening to `any`                 |
| `typecheck` failed | same, but check whether a generated tsconfig drifted — never hand-edit it |
| `test` failed      | reproduce deterministically, fix code/tests, re-run suite                 |

## Suggested Strictness Levels

| Situation                     | Minimum                              |
| ----------------------------- | ------------------------------------ |
| Tiny docs/comment-only change | `vp lint .` + `vp check`             |
| Local WIP coding loop         | targeted lint/check during iteration |
| Ready to mark task done       | full gate (all 6 steps)              |
| Pre-merge or PR update        | full gate (all 6 steps)              |

## Common Anti-Patterns

```bash
# ❌ Skipping lint and jumping to tests
vp run test

# ❌ Running check before formatting/linting
vp check
vp lint .

# ❌ Using non-canonical test command for this project
vp test
```

```bash
# ❌ Assuming `vp check` covers tsc — its type pass is tsgolint, and it never
#    runs the workspace's typecheck script (nor packages/ui's check:public-api)
vp check   # ...and stopping there
```

```bash
# ✅ Canonical sequence
vp fmt .
vp lint .
vp run lint:eslint:check
vp check
vp run typecheck
vp run test
```

From the repo root, `vp run check:safe` chains the whole thing the way CI does.

## Team Policy Snippet (Copy/Paste)

Use this in PR templates or review guides:

- [ ] `vp fmt .` passed
- [ ] `vp lint .` passed
- [ ] `vp run lint:eslint:check` passed
- [ ] `vp check` passed
- [ ] `vp run typecheck` passed
- [ ] `vp run test` passed

## Notes for This Repository Family

In this workspace conventions set, `vp run test` is preferred over `vp test` to avoid known transform issues in certain TypeScript configurations.
