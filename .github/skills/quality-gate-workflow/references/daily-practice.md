---
title: Quality Gate Daily Practice
description: Practical workflow that bridges project quality requirements to daily coding operations
tags: [quality, lint, typecheck, tests, vite-plus, workflow]
---

# Quality Gate Daily Practice

## Overview

Run the quality gate after every change set so correctness and maintainability drift is caught immediately.

## The Gate

Per-workspace stages (`vp fmt`, `vp lint`, `vp run typecheck`, `vp run test`)
run from the workspace whose files changed. `apps/react-router/` is an example,
not the default. From the repo root, `vp run check:safe` chains the whole gate.
Stages 4 and 5 stay root-only.

```bash
vp fmt .
vp lint .
vp run lint:eslint:check
vp run lint:biome:check     # from the repo ROOT
vp run react-doctor:verify  # from the repo ROOT — errors block
vp check
vp run typecheck
vp run test
```

## Why This Order

| Step | Command                      | What It Catches                                           | Why First/Next                                            |
| ---- | ---------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| 1    | `vp fmt .`                   | formatting drift                                          | cheapest auto-fix pass                                    |
| 2    | `vp lint .`                  | rule violations, unsafe patterns, architecture guardrails | avoids type/test noise from known lint failures           |
| 3    | `vp run lint:eslint:check`   | import/module order, react/stylex rules, `local-rules`    | eslint-only rule sets no other stage runs                 |
| 4    | `vp run lint:biome:check`    | the React-domain rules the other two miss                 | root-only pass; last of the three linters                 |
| 5    | `vp run react-doctor:verify` | effect cleanup, server/client boundaries, render cost     | the only pass covering these; errors block                |
| 6    | `vp check`                   | fmt + Oxlint + the tsgolint type pass                     | verifies structural correctness before runtime assertions |
| 7    | `vp run typecheck`           | real `tsc`; `check:public-api` in `packages/ui`           | the reference type-check the tsgolint pass approximates   |
| 8    | `vp run test`                | behavioral regressions                                    | highest-cost stage, run after static checks pass          |

**Three linters, none redundant.** Oxlint (2) runs repo-wide from the root;
eslint (3) fans out per workspace; Biome (4) is root-only — there is no
per-workspace `lint:biome`, because `biome.jsonc`'s `overrides` already scope the
react domain. Run stage 4 from the repo root: inside a workspace it is not the
gate. `vp run lint:all` chains those three with autofix and stops there — it does
**not** run stage 5.

**Stage 5 is not a linter, and no other stage substitutes for it.** React Doctor
is the only pass checking effect cleanup, server/client boundaries and render-path
cost; its errors block ([ADR-055](../../../../docs/decisions/ADR-055-react-doctor-as-a-gate.md)).
Root-only and repo-wide like Biome. When it fails, read
[`react-doctor-triage.md`](../../../../docs/agents/react-doctor-triage.md) before
reaching for any suppression.

**Stages 6 and 7 are different passes, not a retry.** Stage 6's types come from
tsgolint (Oxlint's type-aware path reading each workspace's `tsconfig.app.json`);
stage 7 is the actual compiler, and it is the only stage that runs the
workspace's `typecheck` script — where `packages/ui` gates its public API against
server-only `node:*` imports and the React Router apps regenerate route types.

**When two linters disagree, fix the code — never silence one.** Three overlapping
rule sets will contradict each other, and **the form that silences both is not
automatically correct — check it against the types first.**

Worked example (`@lcabrera/utils`'s `mergeArrays`, see
[ADR-035](../../../../docs/decisions/ADR-035-biome-third-linter.md)): Biome's
`noDoubleEquals` rejects `x == undefined`, eslint's `unicorn/no-null` rejects
`x == null`. `x === undefined` passes both — and is wrong, because the type
admits `null`, so strict equality silently stops matching it. The real fix came
from the domain: arrays are always truthy even when empty, so `!x` means exactly
nullish. Both engines satisfied, semantics intact, nothing suppressed.

## Fast Local Loop (While Building)

Use an incremental loop while coding, then full gate before completion.

1. Make focused change.
2. Run `vp lint .` for fast feedback.
3. If types affected, run `vp check`.
4. Once scope is complete, run full gate.

## Failure Handling Playbook

| Failure Stage         | Action                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `fmt` failed          | re-run `vp fmt .`, inspect changed files                                                                                                     |
| `lint` failed         | fix root cause (avoid suppressions unless justified)                                                                                         |
| `biome` failed        | fix the code; if it contradicts eslint, find the form that satisfies both                                                                    |
| `react-doctor` failed | read `docs/agents/react-doctor-triage.md` first — it records which findings were already argued, and that suppressions exist but are policed |
| `check` failed        | resolve types at source boundary, avoid widening to `any`                                                                                    |
| `typecheck` failed    | same, but check whether a generated tsconfig drifted — never hand-edit it                                                                    |
| `test` failed         | reproduce deterministically, fix code/tests, re-run suite                                                                                    |

## Suggested Strictness Levels

| Situation                     | Minimum                              |
| ----------------------------- | ------------------------------------ |
| Tiny docs/comment-only change | `vp lint .` + `vp check`             |
| Local WIP coding loop         | targeted lint/check during iteration |
| Ready to mark task done       | the full gate, every stage           |
| Pre-merge or PR update        | the full gate, every stage           |

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
# ❌ Running the Biome pass from inside a workspace — it is a ROOT-only,
#    repo-wide pass, so this is not the gate and proves nothing
cd packages/ui && vp run lint:biome:check

# ❌ Silencing one linter to satisfy another
# biome-ignore lint/suspicious/noDoubleEquals: eslint wants it this way
```

```bash
# ✅ Canonical sequence
vp fmt .
vp lint .
vp run lint:eslint:check
vp run lint:biome:check     # from the repo ROOT
vp run react-doctor:verify  # from the repo ROOT — errors block
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
- [ ] `vp run lint:biome:check` passed (from the root)
- [ ] `vp run react-doctor:verify` passed (from the root)
- [ ] `vp check` passed
- [ ] `vp run typecheck` passed
- [ ] `vp run test` passed

## Notes for This Repository Family

In this workspace conventions set, `vp run test` is preferred over `vp test` to avoid known transform issues in certain TypeScript configurations.
