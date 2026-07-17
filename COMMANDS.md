# Command Reference

**The canonical list of every command in this monorepo.** If a command is not
here, it does not exist — and if you add one, add it here in the same commit.

This file is the _what_. The **why** — policy, rationale, and the rules that make
a command mandatory — lives in [AGENTS.md](AGENTS.md); this file links out rather
than restating it, so the reasoning has exactly one home too.

Everything runs through `vp` (Vite+). **Never use `pnpm`/`npm`/`yarn` directly.**

---

## 1. How `vp run <task>` resolves

Read this before hunting for a task definition. A runnable task can come from
**three** places, and grepping `package.json` alone will not find it:

| Source                                     | Example                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `package.json` → `scripts`                 | `packages/ui`'s `typecheck`                                     |
| `vite.config.ts` → `run.tasks`             | `apps/api-server`'s `build` and `test`                          |
| A shared factory from `@repo/vite-configs` | `apps/react-router`'s `test` (via `createReactRouterRunConfig`) |

This is why `test` appears in only 4 of 16 `package.json` files yet
`vp run -r test` runs suites nearly everywhere: the other definitions live in
`vite.config.ts` or come from `packages/vite-configs/vite.run.shared.config.ts`.

Useful flags: `-r` (recursive, dependency order), `--filter <name>` (one
workspace, by **package name** not directory), `--parallel`. Note `--filter` and
`-r` **cannot be combined**.

---

## 2. Daily commands

Run from the workspace you are working in (e.g. `apps/react-router/`).

| Task                 | Command                |
| -------------------- | ---------------------- |
| Install dependencies | `vp install`           |
| Dev server           | `vp dev`               |
| Build                | `vp run build`         |
| Lint + autofix both  | `vp run lint`          |
| Type-check (tsc)     | `vp run typecheck`     |
| Run tests            | `vp run test`          |
| Add / remove a dep   | `vp add` / `vp remove` |

`vp run lint` chains both autofixers (`vp lint . --fix`, then `vp run lint:eslint`)
and is the fastest iteration loop.

---

## 3. The quality gate

The mandatory post-change sequence. Canonical definition and rationale:
the [`quality-gate-workflow` skill](.github/skills/quality-gate-workflow/SKILL.md)
and [AGENTS.md → Post-Change Quality Gate](AGENTS.md#post-change-quality-gate).

| #   | Command                    | Pass                                        |
| --- | -------------------------- | ------------------------------------------- |
| 1   | `vp fmt .`                 | Oxfmt                                       |
| 2   | `vp lint .`                | Oxlint                                      |
| 3   | `vp run lint:eslint:check` | eslint custom rules — **not** in `vp check` |
| 4   | `vp check`                 | fmt + Oxlint + **tsgolint** type pass       |
| 5   | `vp run typecheck`         | real **tsc** — **not** the same as step 4   |
| 6   | `vp run test`              | vitest                                      |

Steps 3 and 5 are the ones that get skipped, and neither is redundant — see
[AGENTS.md §4](AGENTS.md#4-toolchain--vite-vp). From the root, `vp run check:safe`
chains the whole thing the way CI does.

---

## 4. Root orchestration scripts

Run from the repo root. Root scripts are **orchestration only** — anything
project-specific belongs in that project's own `package.json`.

### Gate & CI

| Command                 | Does                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| `vp run ready`          | `check:safe` + `build:all` — the full "is it shippable" check          |
| `vp run check:safe`     | typegen → eslint-rules build → `vp check` → typecheck → eslint → tests |
| `vp run typecheck:all`  | real tsc in all 16 workspaces, dependency order                        |
| `vp run typegen:all`    | route types for both React Router apps                                 |
| `vp run lint:all`       | Oxlint + eslint **with autofix**, every workspace                      |
| `vp run lint:report`    | regenerate `reports/{oxlint,eslint}/full-latest.json`                  |
| `vp run format:all`     | `vp fmt .` across the tree                                             |
| `vp run build:all`      | build every workspace                                                  |
| `vp run test:all`       | every suite — **needs Postgres**                                       |
| `vp run test:ci`        | every DB-free suite — what CI runs, no Postgres needed                 |
| `vp run coverage:merge` | merged coverage for the fallow gate (DB-free workspaces only)          |

`test:all` vs `test:ci`: CI has no database, so `test:ci` substitutes the DB-free
`test:unit` subsets for `@repo/scan-ingestion` / `@repo/scan-orchestrator` and runs
`vite-react-compiler` last so the PR's coverage summary is the fresh one. Run
`test:ci` before pushing if you have no DB up.

### Dev & prod servers

| Command             | Runs                                  |
| ------------------- | ------------------------------------- |
| `vp run dev`        | frontend + **express** api            |
| `vp run dev:fast`   | frontend + **fastify** api            |
| `vp run dev:cqms`   | admin_system + scan-orchestrator      |
| `vp run start`      | prod frontend + express api           |
| `vp run start:fast` | prod frontend + fastify api           |
| `vp run start:cqms` | prod admin_system + scan-orchestrator |

There is deliberately **no `dev:all`/`start:all`**: `car-sales-api` and
`car-sales-api-fast` serve the same domain as performance-comparison alternatives
and must never run simultaneously. Always pick one combo.

### Database

| Command                                 | Does                 |
| --------------------------------------- | -------------------- |
| `vp run db:up`                          | start local Postgres |
| `vp run db:status`                      | container status     |
| `vp run db:down`                        | stop it              |
| `vp run --filter car-sales-api seed`    | seed data            |
| `vp run --filter car-sales-api db:seed` | bring up + seed      |

`seed` and `db:seed` are **api-server scripts, not root scripts** — they need the
`--filter` (or run them from `apps/api-server/`). The API server reads env from
`docker/local/.env`; the frontend proxies `/api` to `http://localhost:3001`.

### Fallow static analysis

Configured once at the repo root (`.fallowrc.json`); it auto-detects every
workspace. Scope any of these with `-w`, e.g. `-w 'apps/react-router'`. Full
policy — entry rules, the CRAP/coverage trap, output conventions — is in
[AGENTS.md → Fallow Static Analysis](AGENTS.md#fallow-static-analysis-run-from-repo-root).

| Command                        | Does                                       |
| ------------------------------ | ------------------------------------------ |
| `vp run fallow:full`           | full scan                                  |
| `vp run fallow:dead-code`      | dead code only                             |
| `vp run fallow:health`         | complexity / health                        |
| `vp run fallow:dupes`          | duplication                                |
| `vp run fallow:audit`          | PR-style gate (`--base main`)              |
| `vp run fallow:refresh-report` | regenerate the complexity threshold report |

Always feed the audit real coverage:
`vp run fallow:audit --base main --coverage reports/fallow/coverage/coverage-final.json`
(produce it with `vp run coverage:merge`). Without it fallow _estimates_ coverage
and reports trivially simple code as `critical`.

### AI config & skills tooling

| Command                      | Does                                        |
| ---------------------------- | ------------------------------------------- |
| `vp run skills:validate`     | validate skill definitions                  |
| `vp run skills:report`       | skills compliance report                    |
| `vp run skills:source-audit` | source smell report + handoff bootstrap     |
| `vp run skills:handoff`      | bootstrap the agenting handoff runbook      |
| `vp run prepare`             | `vp config` — runs automatically on install |
| `vp run lint:claude`         | `claudelint check-all` — **see caveat**     |
| `vp run lint:claude:fix`     | `claudelint format --fix` — **see caveat**  |

> **Caveat — `claudelint` is not installed and not declared.** Both `lint:claude`
> scripts, the `/config-audit` skill, and the `SessionStart` hook documented in
> `.claude/README.md` invoke a `claudelint` binary that appears in no
> `package.json` and has no documented install path, so they fail with
> `cannot find binary path`. Either declare it as a dependency or drop the
> scripts — as of now they are decoration, and the SessionStart hook fails
> silently on every session.

---

## 5. Per-workspace tasks

**Every one of the 16 workspaces** defines these seven:

`format` · `format:check` · `lint` · `lint:check` · `lint:eslint` ·
`lint:eslint:check` · `typecheck`

Beyond that, tasks are per-workspace. `build` and `test` are common but come from
`vite.config.ts` rather than `scripts` in most workspaces (see §1).

| Workspace                     | Package name                | Notable extra tasks                                                                |
| ----------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| `apps/react-router`           | `vite-react-compiler`       | `typegen`, `test:ci`, `test:watch`, `preview`, `knip`, `audit:lighthouse{,:check}` |
| `apps/admin_system`           | `admin-system`              | `typegen`                                                                          |
| `apps/api-server`             | `car-sales-api`             | `seed`, `db:seed`, `start`                                                         |
| `apps/api-server-fast`        | `car-sales-api-fast`        | `seed`, `db:seed`, `start`                                                         |
| `apps/scan-orchestrator`      | `@repo/scan-orchestrator`   | `start`, `test:unit`, `test:coverage`                                              |
| `apps/shared`                 | `api-shared`                | `build`, `test`                                                                    |
| `packages/ui`                 | `@repo/ui`                  | `check:public-api`, `test:coverage`                                                |
| `packages/data-access`        | `@repo/data-access`         | `test:coverage`                                                                    |
| `packages/scan-ingestion`     | `@repo/scan-ingestion`      | `migrate`, `push`, `test:unit`, `test:coverage`                                    |
| `packages/node-runtime`       | `@repo/node-runtime`        | `test:coverage`                                                                    |
| `packages/agent-runner`       | `@repo/agent-runner`        | —                                                                                  |
| `packages/ts-configs`         | `@repo/ts-configs`          | `generate`                                                                         |
| `packages/eslint-local-rules` | `eslint-local-rules-shared` | `build`                                                                            |
| `packages/plugins`            | `@repo/plugins`             | —                                                                                  |
| `packages/utils`              | `@repo/utils`               | —                                                                                  |
| `packages/vite-configs`       | `@repo/vite-configs`        | —                                                                                  |

Notes on the non-obvious ones:

- **`packages/ui` → `check:public-api`** guards the public API graph against
  server-only `node:*` imports. It runs as part of `lint`/`lint:check`/`typecheck`,
  which is how `typecheck:all` enforces it in CI.
- **`packages/ts-configs` → `generate`** rewrites every `tsconfig.app.json` /
  `tsconfig.node.json` in the repo. These are **generated artifacts — never
  hand-edit them**; a hand-edit survives only until the next regeneration
  silently reverts it. Always follow `generate` with `vp fmt .`.
- **A workspace with real-Postgres tests must split them**: keep the full suite as
  `test`, and expose a DB-free `test:unit` (plus `test:coverage`) — otherwise the
  whole workspace drops out of `test:ci` and takes its pure tests with it.
  `scan-ingestion` and `scan-orchestrator` are the precedent.

---

## 6. What CI runs

[`.github/workflows/check-safe.yml`](.github/workflows/check-safe.yml) — three jobs:

| Job              | Steps                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| **Quality Gate** | `typegen:all` + eslint-rules build → `vp check` → `vp run typecheck:all` → `vp run -r lint:eslint:check` |
| **Fallow Audit** | `typegen:all` → `coverage:merge` → `fallow:audit --base <PR base> --coverage …` (PRs only)               |
| **Unit Tests**   | `vp run test:ci` → coverage summary comment on the PR                                                    |

Each pass is a **separate step on purpose** so a failure names itself instead of
hiding behind a neighbour. `vp check` does not run the eslint pass, and it does not
run `tsc`.

Other workflows: `lighthouse.yml`, `validate-skills.yml`.

---

## 7. Troubleshooting

| Symptom                                       | Do this                                                             |
| --------------------------------------------- | ------------------------------------------------------------------- |
| Setup / runtime / package-manager looks wrong | `vp env doctor` — include its output when asking for help           |
| Can't find where a task is defined            | Check all three sources in §1, not just `package.json`              |
| `--filter` errors out                         | It cannot be combined with `-r`; and it takes the **package name**  |
| Every regenerated tsconfig looks dirty        | You skipped `vp fmt .` after `generate` — it is whitespace only     |
| `runQueuedScan.test.ts` flakes on `test:all`  | Stop `vp run dev:cqms` first — it races the test for the CQMS queue |
