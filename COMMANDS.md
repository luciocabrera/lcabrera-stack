# Command Reference

**The canonical list of every command in this monorepo.** If a command is not
here, it does not exist — and if you add one, add it here in the same commit.

That is enforced, not a request: `vp run commands:verify` fails CI when a root
script is undocumented, when this file names a command that no longer resolves,
when a §5 per-workspace claim is wrong, when a link breaks, or when a workspace
count is stale. Its ground truth is `vp run`'s own task list, so it sees all
three task sources (§1). It cannot check prose — rationale still rots the
old-fashioned way.

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

| #   | Command                    | Pass                                          |
| --- | -------------------------- | --------------------------------------------- |
| 1   | `vp fmt .`                 | Oxfmt                                         |
| 2   | `vp lint .`                | Oxlint                                        |
| 3   | `vp run lint:eslint:check` | eslint custom rules — **not** in `vp check`   |
| 4   | `vp run lint:biome:check`  | Biome — **not** in `vp check` (run from root) |
| 5   | `vp check`                 | fmt + Oxlint + **tsgolint** type pass         |
| 6   | `vp run typecheck`         | real **tsc** — **not** the same as step 5     |
| 7   | `vp run test`              | vitest                                        |

Steps 3, 4 and 6 are the ones that get skipped, and none is redundant — see
[AGENTS.md §4](AGENTS.md#4-toolchain--vite-vp). From the root, `vp run check:safe`
chains the whole thing the way CI does.

Step 4 is a **root-only, repo-wide** pass (like Oxlint, unlike the per-workspace
eslint fan-out): `biome.jsonc` at the root scopes the react domain to the three
React workspaces via `overrides`, so there is nothing to fan out. Autofix with
`vp run lint:biome`.

The pre-commit hook runs Biome too, but **not through a script**: the `staged`
block in the root `vite.config.ts` invokes `biome lint` directly, because Vite+
appends the staged filenames to that command and an intermediate script would
have to reconcile those paths with Biome's own `--staged` detection. There is
deliberately no `lint:biome:staged` — one existed, was invoked by nothing, and
claimed to be what the hook ran.

---

## 4. Root orchestration scripts

Run from the repo root. Root scripts are **orchestration only** — anything
project-specific belongs in that project's own `package.json`.

### Gate & CI

| Command                   | Does                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `vp run ready`            | `check:safe` + `build:all` — the full "is it shippable" check                                |
| `vp run check:safe`       | typegen → eslint-rules build → `vp check` → typecheck → eslint → biome → tests               |
| `vp run typecheck:all`    | real tsc in all 16 workspaces, dependency order                                              |
| `vp run typegen:all`      | route types for both React Router apps                                                       |
| `vp run lint:all`         | Oxlint + eslint + Biome **with autofix**, every workspace                                    |
| `vp run lint:biome`       | Biome repo-wide **with autofix** (`--write`, safe fixes only)                                |
| `vp run lint:biome:check` | Biome repo-wide, check only — what CI runs                                                   |
| `vp run lint:report`      | regenerate `reports/{oxlint,eslint,biome}/full-latest.json`                                  |
| `vp run format:all`       | `vp fmt .` across the tree                                                                   |
| `vp run build:all`        | build every workspace                                                                        |
| `vp run test:all`         | every suite — **needs Postgres**                                                             |
| `vp run test:ci`          | every DB-free suite — what CI runs, no Postgres needed                                       |
| `vp run test:changed`     | only the suites a diff touched (changed workspaces + their dependents) — see below           |
| `vp run coverage:merge`   | merged coverage for the fallow gate (DB-free workspaces only)                                |
| `vp run coverage:report`  | per-workspace + monorepo coverage summary for the PR comment (ui, data-access, react-router) |

`test:all` vs `test:ci`: CI has no database, so `test:ci` substitutes the DB-free
`test:unit` subsets for `@repo/scan-ingestion` / `@repo/scan-orchestrator` and runs
`vite-react-compiler` last so the PR's coverage summary is the fresh one. Run
`test:ci` before pushing if you have no DB up.

`test:changed` runs only the suites a diff touched, for a fast local loop. It
diffs the working tree against the branch point (`git merge-base` with
`origin/main`; override the base with `TEST_CHANGED_BASE`), maps changed files to
workspaces, and adds every workspace that transitively **depends on** them — so a
`packages/ui` edit still exercises `apps/react-router`. It prints a per-workspace
summary of what runs and what is skipped. Only the few files that change how every
workspace resolves its tests — `pnpm-lock.yaml`, `pnpm-workspace.yaml`, the root
`vite.config.ts`, and the shared `vite-configs`/`ts-configs` packages — force the
full suite (a real dependency change always bumps the lockfile); every other
out-of-workspace change (root package.json scripts, lint/tsconfig configs, docs,
root `scripts/`) affects no suite and runs nothing. Task substitution mirrors
`test:ci`: the scan packages run their DB-free `test:unit`, and with `--ci` (`node
scripts/test-changed.mjs --ci`) `vite-react-compiler` runs its coverage `test:ci`
last. `--dry-run` prints the `vp run` commands without executing them. CI's Unit
Tests job (and its coverage report) scope to the diff on pull requests; pushes to
`main` still run the full `test:ci`.

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

| Command                      | Does                                                     |
| ---------------------------- | -------------------------------------------------------- |
| `vp run commands:verify`     | check this file still matches reality                    |
| `vp run scripts:verify`      | check `.mjs`/`.cjs` size ceiling (`--write` rebaselines) |
| `vp run skills:validate`     | validate skill definitions                               |
| `vp run skills:report`       | skills compliance report                                 |
| `vp run skills:source-audit` | source smell report + handoff bootstrap                  |
| `vp run skills:handoff`      | bootstrap the agenting handoff runbook                   |
| `vp run prepare`             | `vp config` — runs automatically on install              |

### Coordination register

The in-git "who is working on what" register under [`docs/coordination/`](docs/coordination/README.md).

| Command                                       | Does                                                                                                             |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `vp run coordination:verify`                  | check the task register + `BOARD.md` are consistent (CI gate)                                                    |
| `vp run coordination:board`                   | regenerate `docs/coordination/BOARD.md` from the task files                                                      |
| `vp run coordination:board:live`              | live view: claims joined with open-PR state (draft/checks) + unregistered PRs (needs `gh`; prints, never writes) |
| `vp run coordination:claim -- <id> "<title>"` | scaffold a task + branch (or `--worktree`) + draft PR in one step (`--dry-run` to preview)                       |

### Commit & PR standards

Conventional-Commit messages and structured PR descriptions, enforced from one
spec ([`scripts/lib/commit-convention.mjs`](scripts/lib/commit-convention.mjs)).
The `commit-msg` git hook runs `commit:verify` locally; `.github/workflows/pr-standards.yml`
runs both in CI. See the [`commit-and-pr`](.github/skills/commit-and-pr/SKILL.md) skill.

| Command                                           | Does                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `vp run commit:verify -- <file \| ->`             | validate a commit message (file path, or `-` for stdin) — used by the hook      |
| `vp run pr:verify`                                | validate a PR title (`PR_TITLE`) + description (`PR_BODY`) against the standard |
| `vp run pr:verify -- --title <t> --body-file <p>` | simulate the PR check locally without opening a PR                              |

### Changelog & labels

Both derive from the same commit convention: the changelog groups
Conventional-Commit history by type; the labels are the `app:`/`pkg:`/`type:`
taxonomy applied to PRs. See the [`commit-and-pr`](.github/skills/commit-and-pr/SKILL.md) skill.

| Command                     | Does                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `vp run changelog:generate` | regenerate `CHANGELOG.md` from git history, grouped by version → type              |
| `vp run labels:sync`        | create/update the `app:`/`pkg:`/`type:` label set on GitHub (needs `GITHUB_TOKEN`) |

`CHANGELOG.md` is generated — never hand-edit it. `.github/workflows/labeler.yml`
auto-applies labels to every PR (scope from the changed workspaces via
`scripts/pr-labels.mjs`, type from the PR title); `.github/workflows/changelog.yml`
publishes per-release notes on a `v*` tag.

### SonarCloud reporting

SonarCloud runs in **Automatic Analysis** mode (the GitHub App analyses each push
server-side — no scanner in this repo). These pull its findings into a tracked
report so agents/CI act on them from a file, not the dashboard. Needs a read-only
`SONAR_TOKEN` (gitignored root `.env` or a CI secret — see `.env.example`); without
one the script skips gracefully. Feature branches are analysed as PRs, so target
them with `--pr <n>` (the tracked snapshot is `main`).

| Command                                           | Does                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `vp run sonar:report`                             | fetch issues + hotspots + quality gate → `reports/sonar/full-latest.json` |
| `vp run sonar:report -- --pr 31`                  | report scoped to a pull request                                           |
| `vp run sonar:verify`                             | gate mode — exit non-zero when the SonarCloud quality gate is failing     |
| `vp run sonar:verify -- --pr 31 --fail-on-issues` | stricter: also fail on any open issue, not just gate ERROR                |

---

## 5. Per-workspace tasks

**Every one of the 16 workspaces** defines these seven:

`format` · `format:check` · `lint` · `lint:check` · `lint:eslint` ·
`lint:eslint:check` · `typecheck`

Beyond that, tasks are per-workspace. `build` and `test` are common but come from
`vite.config.ts` rather than `scripts` in most workspaces (see §1).

| Workspace                     | Package name                | Notable extra tasks                                                                                 |
| ----------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/react-router`           | `vite-react-compiler`       | `typegen`, `test:ci`, `test:watch`, `preview`, `knip`, `audit:lighthouse`, `audit:lighthouse:check` |
| `apps/admin_system`           | `admin-system`              | `typegen`                                                                                           |
| `apps/api-server`             | `car-sales-api`             | `seed`, `db:seed`, `start`                                                                          |
| `apps/api-server-fast`        | `car-sales-api-fast`        | `seed`, `db:seed`, `start`                                                                          |
| `apps/scan-orchestrator`      | `@repo/scan-orchestrator`   | `start`, `test:unit`, `test:coverage`                                                               |
| `apps/shared`                 | `api-shared`                | `build`, `test`                                                                                     |
| `packages/ui`                 | `@repo/ui`                  | `check:public-api`, `test:coverage`                                                                 |
| `packages/data-access`        | `@repo/data-access`         | `test:coverage`                                                                                     |
| `packages/scan-ingestion`     | `@repo/scan-ingestion`      | `migrate`, `push`, `test:unit`, `test:coverage`                                                     |
| `packages/node-runtime`       | `@repo/node-runtime`        | `test:coverage`                                                                                     |
| `packages/agent-runner`       | `@repo/agent-runner`        | —                                                                                                   |
| `packages/ts-configs`         | `@repo/ts-configs`          | `generate`                                                                                          |
| `packages/eslint-local-rules` | `eslint-local-rules-shared` | `build`                                                                                             |
| `packages/plugins`            | `@repo/plugins`             | —                                                                                                   |
| `packages/utils`              | `@repo/utils`               | —                                                                                                   |
| `packages/vite-configs`       | `@repo/vite-configs`        | —                                                                                                   |

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

| Job              | Steps                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Quality Gate** | `typegen:all` + eslint-rules build → `vp check` → `vp run typecheck:all` → `vp run -r lint:eslint:check` → `vp run lint:biome:check` |
| **Fallow Audit** | `typegen:all` → `coverage:merge` → `fallow:audit --base <PR base> --coverage …` (PRs only)                                           |
| **Unit Tests**   | `vp run test:ci` → `vp run coverage:report` → per-workspace + monorepo coverage matrix comment on the PR                             |

Each pass is a **separate step on purpose** so a failure names itself instead of
hiding behind a neighbour. `vp check` does not run the eslint pass, it does not run
Biome, and it does not run `tsc`.

The three jobs run in **parallel** — "Biome runs before Fallow" holds within the
Quality Gate job's step order, not across jobs.

Other workflows: `lighthouse.yml`, `validate-skills.yml`, and
[`pr-standards.yml`](.github/workflows/pr-standards.yml) — on every pull request
it runs `pr:verify` (title + description) and `commit:verify` over each non-merge
commit in the range, so nothing that skipped the local hook reaches `main`.
[`labeler.yml`](.github/workflows/labeler.yml) auto-labels each PR
(`app:`/`pkg:`/`type:`), [`sync-labels.yml`](.github/workflows/sync-labels.yml)
syncs the label set when the manifest/workspace list changes on `main`,
[`update-changelog.yml`](.github/workflows/update-changelog.yml) regenerates
`CHANGELOG.md` after every merge to `main`, and
[`changelog.yml`](.github/workflows/changelog.yml) publishes release notes on a
`v*` tag.

---

## 6b. What runs before a commit

Vite+ owns the git hooks — `core.hooksPath` points at `.vite-hooks/`, installed by
`vp config` (the root `prepare` script). Do **not** add husky/lefthook or repoint
`core.hooksPath`: the next `vp install` runs `prepare` and takes it back.

`.vite-hooks/pre-commit` runs `vp staged`, which reads the `staged` block in the
root `vite.config.ts`:

| Glob                 | Command                               |
| -------------------- | ------------------------------------- |
| `*`                  | `vp check --fix`                      |
| `*.{ts,tsx,mjs,cjs}` | `biome lint --no-errors-on-unmatched` |

Biome is **check-only** here on purpose: `vp check --fix` autofixes, but a Biome
autofix could rewrite a staged file after you reviewed it, so a violation fails the
commit and you apply the fix deliberately with `vp run lint:biome`.

`.vite-hooks/commit-msg` runs `node scripts/verify-commit-msg.mjs "$1"`, validating
the commit message against the Conventional-Commit standard before the commit is
created (merge/revert/`fixup!` messages are skipped). The `_/` shims are gitignored
but the committed sibling hooks (`pre-commit`, `commit-msg`) persist across every
`vp config` regeneration.

The hooks only see **staged** files / the local message — CI's repo-wide passes
(`check-safe.yml` for code, `pr-standards.yml` for commits + the PR) are what catch
anything arriving via `--no-verify` or an unhooked push. Note the eslint pass is not
in a hook either; it is a CI-and-local-gate step.

---

## 7. Troubleshooting

| Symptom                                       | Do this                                                             |
| --------------------------------------------- | ------------------------------------------------------------------- |
| Setup / runtime / package-manager looks wrong | `vp env doctor` — include its output when asking for help           |
| Can't find where a task is defined            | Check all three sources in §1, not just `package.json`              |
| `--filter` errors out                         | It cannot be combined with `-r`; and it takes the **package name**  |
| Every regenerated tsconfig looks dirty        | You skipped `vp fmt .` after `generate` — it is whitespace only     |
| `runQueuedScan.test.ts` flakes on `test:all`  | Stop `vp run dev:cqms` first — it races the test for the CQMS queue |
