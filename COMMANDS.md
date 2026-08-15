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

| Source                                        | Example                                                         |
| --------------------------------------------- | --------------------------------------------------------------- |
| `package.json` → `scripts`                    | `packages/ui`'s `typecheck`                                     |
| `vite.config.ts` → `run.tasks`                | `apps/api-server`'s `build` and `test`                          |
| A shared factory from `@lcabrera/vite-config` | `apps/react-router`'s `test` (via `createReactRouterRunConfig`) |

This is why `grep -l '"test":' apps/*/package.json packages/*/package.json`
finds almost nothing yet `vp run -r test` runs suites nearly everywhere: the
other definitions live in each workspace's `vite.config.ts`, or come from
`packages/vite-configs/src/vite.run.shared.config.ts`.

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

The mandatory post-change sequence. **Canonical definition and rationale: the
[`quality-gate-workflow` skill](.github/skills/quality-gate-workflow/SKILL.md)**,
and nowhere else. The table below is the _command reference_ this file exists to be
— which is why it is here and gated by `commands:verify`. If it and the skill ever
disagree about the stages, the skill is right and this table is the bug.

| #   | Command                      | Pass                                          |
| --- | ---------------------------- | --------------------------------------------- |
| 1   | `vp fmt .`                   | Oxfmt                                         |
| 2   | `vp lint .`                  | Oxlint                                        |
| 3   | `vp run lint:eslint:check`   | eslint custom rules — **not** in `vp check`   |
| 4   | `vp run lint:biome:check`    | Biome — **not** in `vp check` (run from root) |
| 5   | `vp run react-doctor:verify` | React Doctor — root-only, errors block        |
| 6   | `vp check`                   | fmt + Oxlint + **tsgolint** type pass         |
| 7   | `vp run typecheck`           | real **tsc** — **not** the same as step 6     |
| 8   | `vp run test`                | vitest                                        |

Which stages get skipped in practice and why none is redundant is the skill's to
explain, not this file's. From the root, `vp run check:safe` chains the whole thing
the way CI does.

The **`pre-push` git hook** (`.vite-hooks/pre-push`) runs `vp run check:push` — the
**DB-free CI Quality Gate** (steps 3–6 plus `commands:verify`, `coordination:verify`,
`scripts:verify`, `docs:verify`, `renames:verify`, `route-names:verify`,
`adr:verify`, `viteplus:verify` and `configs:verify`, mirroring the
"Quality Gate (Format · Lint · Types)" job in
`check-safe.yml`) — and then
`vp run test:changed`. This closes the gap the pre-commit hook leaves: `vp staged` covers
only fmt + Oxlint + tsgolint + Biome on staged files, so the ESLint pass and a full
type-check first turn red in CI otherwise. **Tests are scoped, not the full suite**:
`test:changed` runs only the workspaces the push touches plus their dependents, so a
docs-only push runs none. The full suite is forced only by a change to `pnpm-lock.yaml`,
`pnpm-workspace.yaml`, the root `vite.config.ts`, or the shared config packages
(`@lcabrera/vite-config` / `@repo/ts-configs`) — deliberately **not** by any root file, since
a real dependency change always moves the lockfile.
The **fallow audit** stays CI-only — it is a new-only gate scored against the merge base,
needing full history and a coverage merge. `vp run` caches per task, so a warm push is
quick; bypass a WIP push with `git push --no-verify`.

Before running anything the hook sources
[`.vite-hooks/scrub-git-env.sh`](.vite-hooks/scrub-git-env.sh), and **must** keep
doing so. Git exports `GIT_DIR` to every hook, and it outranks the working
directory for every `git` a task spawns — so a test that builds a throwaway repo
instead rewrites this one's index, silently, leaving `HEAD` intact until the next
commit writes a near-empty tree. That script records the incident; the hook
refuses to run if it is missing.

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

| Command                      | Does                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `vp run ready`               | `check:safe` + `build:all` — the full "is it shippable" check                                     |
| `vp run check:safe`          | typegen → `vp check` → typecheck → eslint → biome → tests                                         |
| `vp run check:push`          | the DB-free CI Quality Gate (no tests/fallow) — the `pre-push` hook runs this then `test:changed` |
| `vp run typecheck:all`       | real tsc in all 18 workspaces, dependency order                                                   |
| `vp run typecheck:changed`   | real tsc for the changed workspaces + dependents only — see below                                 |
| `vp run typegen:all`         | route types for both React Router apps                                                            |
| `vp run lint:all`            | Oxlint + eslint + Biome **with autofix**, every workspace                                         |
| `vp run lint:biome`          | Biome repo-wide **with autofix** (`--write`, safe fixes only)                                     |
| `vp run lint:biome:check`    | Biome repo-wide, check only — what CI runs                                                        |
| `vp run lint:report`         | write `reports/{oxlint,eslint,biome}/full-latest.json` (gitignored — produced on demand)          |
| `vp run react-doctor:verify` | React Doctor gate (ADR-055) — full scope, fails on error severity; writes the report too          |
| `vp run react-doctor:report` | the same scan, never failing — writes `reports/react-doctor/full-latest.json` (gitignored)        |
| `vp run format:all`          | `vp fmt .` across the tree                                                                        |
| `vp run build:all`           | build every workspace                                                                             |
| `vp run test:all`            | every suite — **needs Postgres**                                                                  |
| `vp run test:ci`             | every DB-free suite — what CI runs, no Postgres needed                                            |
| `vp run test:changed`        | only the suites a diff touched (changed workspaces + their dependents) — see below                |
| `vp run test:scripts`        | the root `scripts/` suites — not a workspace, so the `-r` fan-out never reaches it                |
| `vp run coverage:merge`      | merged coverage for the fallow gate (DB-free workspaces only)                                     |
| `vp run coverage:report`     | per-workspace + monorepo coverage summary for the PR comment (ui, server, react-router)           |

`test:all` vs `test:ci`: CI has no database, so `test:ci` substitutes the DB-free
`test:unit` subsets for `@repo/scan-ingestion` / `@repo/scan-orchestrator` and runs
`vite-react-compiler` last so the PR's coverage summary is the fresh one. Run
`test:ci` before pushing if you have no DB up.

`test:scripts` is chained into both, and needs to be: root `scripts/` is **not a
workspace**, so `vp run -r test` never reaches it. That is why the logic behind
`commit:verify`, `coordination:verify` and `docs:verify` went untested for as
long as it did — a gate whose decision logic silently stops matching reports
exactly what compliant input reports, which is nothing.

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

`typecheck:changed` applies the same change-based selection to the Quality Gate's
slowest per-workspace step — real `tsc` across all 18 workspaces. It runs
`typecheck` only for the changed workspaces plus their dependents (a type error a
diff introduces surfaces where the type is used, which the dependents walk covers),
falling back to the full run on the same shared/root triggers and on pushes to
`main`. The generic runner is `scripts/run-changed.mjs <task>`; `vp check`'s
repo-wide tsgolint pass still type-checks every PR as a net. CI's Quality Gate uses
it on pull requests and posts the per-workspace selection to the job summary.

### Dependencies

| Command               | Runs                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `vp run deps:audit`   | the advisory gate — `vp pm audit --json` piped into `scripts/verify-deps-audit.mjs`               |
| `vp run deps:refresh` | one-command dependency refresh — pnpm clean → taze (catalog) → vp install → open a build(deps) PR |

`deps:audit` fails on a known vulnerability at `moderate` or above that has no
live allowance in `docs/agents/dependency-advisories.json`, and also on an
allowance that has expired or that matches nothing in the tree. It **needs the
registry**, and refuses a report that walked no dependencies — an unreachable
registry produces the same empty advisory list as a healthy tree, so the gate
fails rather than reporting clean. Raise the floor for one run with
`vp pm audit --json | node scripts/verify-deps-audit.mjs --minimum high`.
It runs in CI's Quality Gate and daily in `deps-audit.yml`, but deliberately not
in the `pre-push` hook, which must work offline. What to do when it fires is
[`docs/agents/dependency-advisories.md`](docs/agents/dependency-advisories.md).

`deps:refresh` (`scripts/deps-refresh.sh`) bumps the pnpm catalog and every
`package.json` to their latest in-range versions (TypeScript is held for a known
compatibility issue), then opens the issue, branch and PR. It reaches for `pnpm
clean` and `taze` directly — commands vp does not wrap — and it stops rather than
auto-merging: a failing quality gate leaves the branch for a human. `-- --dry-run`
previews what would move without changing anything. The pnpm-direct policy nuance
is tracked in issue #334.

**A gate failure is resumable — do not re-run the full refresh.** The stop leaves
the issue, branch and commit in place but no PR, and a second full run would open
a duplicate issue and branch. Fix the findings, commit them on the same branch,
then finish with `-- --open-pr`: it pushes (the gate runs again) and opens the PR
with the same generated description, recovering the moved-versions list from the
commit the first run wrote. Its Impact Analysis reports any source commits the
gate forced, rather than claiming the diff is manifests-only.

**A run can land with no version moved at all.** `pnpm clean --lockfile`
regenerates the lockfile from nothing, so it drops resolutions no manifest reaches
any more — a real change worth committing, not formatting churn. Regeneration is
idempotent, so a lockfile with nothing stale in it regenerates byte-identical and
the script exits without opening anything.

### Dev & prod servers

| Command                   | Runs                                                        |
| ------------------------- | ----------------------------------------------------------- |
| `vp run dev:showcase`     | the showcase frontend **alone** — Postgres is all it needs  |
| `vp run dev`              | frontend + **express** api                                  |
| `vp run dev:fast`         | frontend + **fastify** api                                  |
| `vp run dev:external-api` | frontend + express api, with the `VITE_API_URL` override on |
| `vp run dev:cqms`         | admin_system + scan-orchestrator                            |
| `vp run start`            | prod frontend + express api                                 |
| `vp run start:fast`       | prod frontend + fastify api                                 |
| `vp run start:cqms`       | prod admin_system + scan-orchestrator                       |

There is deliberately **no `dev:all`/`start:all`**: `car-sales-api` and
`car-sales-api-fast` serve the same domain as performance-comparison alternatives
and must never run simultaneously. Always pick one combo.

**`dev:showcase` is the one to reach for.** Every table route in
`apps/react-router` serves its own rows from Postgres, so the api-server is no
longer part of rendering the showcase — see
[the app's data-sources doc](apps/react-router/docs/data-sources.md).
`dev:external-api` is the counterpart that keeps the other path honest: it sets
`VITE_API_URL` so the same routes go through `car-sales-api` instead, which is
the only way that branch gets exercised by hand. (An app-level `.env` is loaded
after the variable is exported, so one that sets `VITE_API_URL` itself wins —
that is the local override of the local override, and it is deliberate.)

### Database

| Command                                       | Does                                               |
| --------------------------------------------- | -------------------------------------------------- |
| `vp run db:up`                                | start local Postgres                               |
| `vp run db:status`                            | container status                                   |
| `vp run db:down`                              | stop it                                            |
| `vp run --filter vite-react-compiler seed`    | create + seed the showcase's own tables            |
| `vp run --filter vite-react-compiler db:seed` | bring up + seed                                    |
| `vp run --filter car-sales-api seed`          | seed the API servers' copy of the car-sales tables |
| `vp run --filter car-sales-api db:seed`       | bring up + seed                                    |

`seed` and `db:seed` are **workspace scripts, not root scripts** — they need the
`--filter` (or run them from the workspace directory). **Each side owns its own
DDL and its own runner**
([ADR-071](docs/decisions/ADR-071-split-the-demo-database-setup.md)): the
showcase's is `apps/react-router/db/`, applied through `pg` so it needs only
Docker and Node, and the API servers' is `apps/api-server/db/`, which covers the
car-sales tables alone. Seeding the showcase is what creates `enterprise_orders`.
Both read env from `docker/local/.env` and then the workspace's own `.env`; the
frontend proxies `/api` to `http://localhost:3001`.

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

### Micro-benchmarks

| Command                  | Does                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `vp run bench:array-ops` | time the five array-operation shapes ADR-054 chooses between (`--json` for raw data) |

Not part of any gate — it exists so the performance claims in
[ADR-054](docs/decisions/ADR-054-array-operation-hierarchy.md) and the array-operation
table in [`.claude/rules/typescript.md`](.claude/rules/typescript.md) can be re-derived
instead of trusted. Prefer re-running it over quoting a remembered figure; the **ordering**
is what the guidance rests on, not the absolute timings.

### Publishing the public packages

The public packages that build (every one but `@lcabrera/ui`) emit `dist`
because a `.ts` file inside `node_modules` is not loadable — Node refuses to
strip types there (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), and Vite
externalizes dependencies for SSR by default, so source-shipping fails when a
consumer's server starts rather than when it typechecks.

`exports` still points at `src`, so **nothing in this repo has to build first**;
pnpm substitutes `publishConfig.exports` (pointing at `dist`) at pack time. That
substitution is a **pnpm** extension — `npm pack` ignores it and produces a
tarball a consumer cannot load — which is why `publish:verify` checks the packed
tarball and asserts the release path is still the pnpm one
([ADR-073](docs/decisions/ADR-073-publishing-gates-check-the-packed-tarball.md)).
`@lcabrera/ui` is deliberately excluded from the build — StyleX derives theme
identity from the source path, so it ships source and the consumer's own plugin
compiles it.

| Command                                | Does                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `vp run packages:build`                | build the publishable packages (`vp pack` → `dist` with `.d.mts` and sourcemaps)                                         |
| `vp run publish:verify`                | pack each one with pnpm and check the tarball — exports, files, and a real consumer import from outside the repo         |
| `vp run publish:verify -- --write`     | regenerate `publishConfig.exports` from `exports`                                                                        |
| `vp run api-surface:verify`            | diff each public package's exported type surface against its tracked snapshot; require a changeset for a breaking change |
| `vp run api-surface:verify -- --write` | regenerate the surface snapshots under `reports/api-surface/`                                                            |
| `vp run attw:verify`                   | run Are The Types Wrong? over the built public packages — do the published types resolve for a consumer?                 |

Run `packages:build` **before** `publish:verify`, `api-surface:verify` and
`attw:verify`: with no `dist/` there is no artifact to check, and all three
**fail** rather than reporting a pass they did not earn (ADR-073).
`publish:verify` also needs pnpm on PATH, which running it through `vp` provides.
`ui` ships source, so its surface is always checked. The API-surface snapshot and
its `ui`-vs-built split are
[ADR-046](docs/decisions/ADR-046-public-api-surface-snapshot.md).

### Releasing a package

Versions are chosen by people, bumped by one command, and published by CI.

| Command                  | Does                                                                          |
| ------------------------ | ----------------------------------------------------------------------------- |
| `vp run release:add`     | write a changeset — pick the packages and patch/minor/major, say what changed |
| `vp run release:plan`    | per package: local version vs npm, and what CI would publish right now        |
| `vp run release:status`  | show what would be released, versus `origin/main`                             |
| `vp run release:version` | consume the changesets: bump versions, write per-package changelogs           |

The loop: a change that affects consumers ships with a changeset in the same PR
(`vp run release:add`). When you want to cut a release, run
`vp run release:version` and open an ordinary PR with the result. Merging it
triggers [`release.yml`](.github/workflows/release.yml), which builds, publishes
every package whose version is not yet on npm, and opens a GitHub Release for it.

`release:plan` is that workflow's own gate, runnable locally: it asks the
registry package by package, so an unrelated package's pending changeset no
longer suppresses the whole release (#620). `release:status` answers a different
question — what the _changesets_ would do at the next `release:version` — so the
two disagreeing is normal, and the gap between them is the release cycle.

Two deliberate constraints, both explained in
[AGENTS.md](AGENTS.md#releasing-changelog--labels) and in full in the `releasing`
skill:
the version PR is **not** opened by a bot, and the **first** publish of each
package must be done by hand before trusted publishing can take over.

That first publish has a script, because an npm version is permanent and the
ways to get it wrong — stale checkout, wrong account, publishing before the
version bump merged — are all undoable only by never making them:

```bash
npm login --auth-type=legacy                      # once
bash scripts/publish-bootstrap.sh --dry-run       # checks everything, sends nothing
bash scripts/publish-bootstrap.sh                 # publishes
```

It is safe to re-run: a package already on the registry at its current version is
skipped, so a run that fails halfway can simply be repeated. Needed once per
package, ever.

### AI config & skills tooling

| Command                      | Does                                                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vp run commands:verify`     | check this file still matches reality                                                                                                                                                                |
| `vp run scripts:verify`      | check `.mjs`/`.cjs` size ceiling (`--write` rebaselines)                                                                                                                                             |
| `vp run lint:plugins:verify` | prove every Oxlint plugin family is loaded, and that no workspace config shadows the root ([ADR-042](docs/decisions/ADR-042-oxlint-config-at-the-root.md))                                           |
| `vp run lint:eslint:verify`  | prove the **eslint** pass still runs its rules — plants a misordered import and requires `perfectionist/sort-imports` to report it (#472)                                                            |
| `vp run suppressions:verify` | check the four public packages carry no unapproved suppression (see [the protocol](docs/agents/public-package-suppressions.md))                                                                      |
| `vp run suppressions:list`   | print every suppression reaching a public package, approved or not                                                                                                                                   |
| `vp run docs:verify`         | check every documented repository path resolves (`--write` prunes resolved baseline entries; `--accept <doc> <ref> --reason "…"` grandfathers one)                                                   |
| `vp run renames:verify`      | check no document still names a file this change renamed away — scoped to the diff, which is what lets it check bare filenames at all (`--base <ref>`, default `origin/main`)                        |
| `vp run route-names:verify`  | check every `*.types`/`*.constants` file in a route folder names an artifact that folder holds — the half of `local-rules/domain-folder-filename` an ESLint rule cannot reach (#613)                 |
| `vp run adr:verify`          | check ADR home, filename, heading and number uniqueness, and that each home's index is current; prints the next free number (`--write` regenerates the indexes)                                      |
| `vp run adr:new`             | scaffold an ADR from [`_TEMPLATE.md`](docs/decisions/_TEMPLATE.md) with the next free number — `-- "<title>" [--home repo\|cqms\|app] [--slug <s>] [--dry-run]`                                      |
| `vp run viteplus:verify`     | check AGENTS.md has no Vite+ managed block rendering content — the markers are removed so `vp install` cannot refill them; this catches them coming back (`--write` re-empties a refilled one)       |
| `vp run configs:verify`      | check no formatter/linter config file exists that no engine reads — fmt and lint are configured once in the root `vite.config.ts` (ADR-042), so a `.oxfmtrc.json`/`.prettierrc` beside it is a decoy |
| `vp run skills:validate`     | validate skill definitions                                                                                                                                                                           |
| `vp run skills:report`       | skills compliance report                                                                                                                                                                             |
| `vp run prepare`             | `vp config` — runs automatically on install                                                                                                                                                          |

### Coordination register

The in-git "who is working on what" register under [`docs/coordination/`](docs/coordination/README.md).

| Command                                       | Does                                                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vp run coordination:verify`                  | check the task register (schema, unique ids, `area` overlap across live branches; `--no-remote` to skip) — CI gate                                                 |
| `vp run coordination:board`                   | write the local, gitignored `docs/coordination/BOARD.md` table view (never committed — ADR-037)                                                                    |
| `vp run coordination:board:live`              | live view: claims joined with open-PR state (draft/checks) + unregistered PRs (needs `gh`; prints, never writes)                                                   |
| `vp run coordination:claim -- <id> "<title>"` | scaffold a task + branch (or `--worktree`) + draft PR in one step (`--dry-run` to preview)                                                                         |
| `vp run coordination:close -- --pr <n>`       | delete the task file(s) that PR claimed — `--branch <head-ref>` also matches a claim that never recorded its PR, `--dry-run` reports and deletes nothing           |
| `vp run worktree:env`                         | symlink the primary checkout's gitignored env files into the worktree you run it from (`--dry-run` to preview, `--target <dir>` for another) — see below           |
| `vp run housekeeping:prune`                   | dry-run the shared-checkout broom: list branches/worktrees safe to delete (merged/closed PR or cruft) and what is kept (un-PR'd commits, dirty worktrees, stashes) |
| `vp run housekeeping:prune -- --apply`        | perform those deletions; never touches anything with unique un-PR'd commits, an uncommitted worktree, or a stash (needs `gh`; falls back to commit-count-only)     |

`coordination:claim` already installs dependencies and generates route types in a
new worktree, but **not** the env files: they are gitignored, so a worktree starts
without them, and a DB-touching command there does not fail — it runs with the env
unloaded, which reads as a code bug. `worktree:env` is the deliberate, opt-in step
that closes that, and it **symlinks rather than copies**, so no second credential
exists on disk and none outlives the worktree. It is idempotent (an existing path is
reported and left alone) and skips nested checkouts, whose env files belong to
another tree.

`coordination:close` is normally not run by hand: `.github/workflows/coordination-close.yml`
runs it on every PR merged into `main` and commits the deletion when there is one.
Run it yourself to preview (`--dry-run`) or to sweep a claim the automation could
not — a PR merged from a fork, or one whose task file records neither its number
nor its head ref.

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
| `vp run branch:verify`                            | validate the current branch name — used by the pre-push hook and CI             |
| `vp run branch:verify -- --branch <name>`         | validate a specific branch name without checking it out                         |
| `vp run issue:verify`                             | validate an issue description (`ISSUE_BODY`) against the issue template         |
| `vp run issue:verify -- --body-file <p>`          | validate an issue description from a file                                       |

### Review gates

`Copilot review complete` is a commit status that is green only while Copilot's
newest review names the pull request's **current head commit** — a review of a
superseded commit looks identical in the UI to a review of the head, which is how
a PR reaches a mergeable state unreviewed.
[`copilot-review-gate.yml`](.github/workflows/copilot-review-gate.yml) recomputes
it on every push and every review; the command below is the same comparison run
by hand. The states and the break-glass path are in
[`docs/tooling/copilot-review-gate.md`](docs/tooling/copilot-review-gate.md).

| Command                                              | Does                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `vp run copilot-review:status -- --pr <n> --dry-run` | print the state the gate would publish for a PR, posting nothing |
| `vp run copilot-review:status -- --pr <n>`           | publish that state against the PR's current head commit          |

### Autonomous PR queue

`vp run pr:queue` reads every open PR, derives the merge order, and decides each
one against [`.claude/pr-queue-policy.md`](.claude/pr-queue-policy.md) — the
policy is the operator's only authority, and every verdict in the log cites the
rule ids behind it. It runs headless Claude twice per PR: a read-only decide pass
that produces the verdict, then (only with `--apply`) an execute pass bounded to
the actions that verdict authorised. The decision log is written between them, so
what ran can be checked against what was approved.

| Command                          | Does                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `vp run pr:queue`                | dry run: decide every open PR, write the decision log, change nothing                           |
| `vp run pr:queue -- --apply`     | execute each decision in merge order — rebase, fix, address review threads, squash-merge, close |
| `vp run pr:queue -- --pr <n>`    | decide one PR, still judged in the context of the whole queue's ordering                        |
| `vp run pr:queue -- --model <m>` | pick the model for both passes                                                                  |

Logs land in `reports/pr-queue/runs/<timestamp>/` (`decision-log.md` to read,
`decisions.json` to diff) — produced on demand, never committed ([ADR-049](docs/decisions/ADR-049-findings-reports-are-produced-on-demand.md)).

### Planning backlog → GitHub

`vp run plan:issues` turns a planning document into Milestones, issues and real
sub-issue links. **`--plan <file>` is required** — there is no tracked default,
because GitHub Issues are the durable backlog ([ADR-036](docs/decisions/ADR-036-github-planning-layer.md))
and a standing "the backlog" file in git would be a second one. A plan is authored
for one session, consumed by `--create`, then retired; keep the working copy under
the gitignored `.tmp/planning/`. It checks first and calls `gh` second: every rendered body must
pass the same `validateIssueBody` that `issue-standards.yml` runs on open, every
label must exist in the taxonomy (`scripts/lib/labels.mjs`), and every milestone
must be one the naming scheme defines. Nothing is created if anything would be
rejected.

| Command                                    | Does                                                               |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `vp run plan:issues -- --plan <file>`      | verify the backlog would be accepted; create nothing               |
| `vp run plan:issues -- --emit <dir>`       | write the rendered bodies + `manifest.json` for review             |
| `vp run plan:issues -- --create --dry-run` | print every `gh` call it would make                                |
| `vp run plan:issues -- --create`           | create the milestones, the issues, and each epic's sub-issue links |

Epics are created before their children so a sub-issue link always has a target.
Re-running is safe for milestones (existing titles are skipped) but **not** for
issues — `gh issue create` has no idempotency, so a second `--create` opens a
second set. Use `--dry-run` first.

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
them with `--pr <n>`. Nothing is committed — every run writes its own gitignored
file under `reports/sonar/runs/` ([ADR-049](docs/decisions/ADR-049-findings-reports-are-produced-on-demand.md)).

| Command                                           | Does                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `vp run sonar:report`                             | fetch issues + hotspots + quality gate → `reports/sonar/runs/branch-main.json` |
| `vp run sonar:report -- --pr 31`                  | report scoped to a PR → `reports/sonar/runs/pr-<n>.json`                       |
| `vp run sonar:verify`                             | gate mode — exit non-zero when the SonarCloud quality gate is failing          |
| `vp run sonar:verify -- --pr 31 --fail-on-issues` | stricter: also fail on any open issue, not just gate ERROR                     |

---

## 5. Per-workspace tasks

**Every one of the 18 workspaces** defines these seven:

`format` · `format:check` · `lint` · `lint:check` · `lint:eslint` ·
`lint:eslint:check` · `typecheck`

Beyond that, tasks are per-workspace. `build` and `test` are common but come from
`vite.config.ts` rather than `scripts` in most workspaces (see §1).

| Workspace                     | Package name              | Notable extra tasks                                                                                                    |
| ----------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `apps/react-router`           | `vite-react-compiler`     | `typegen`, `test:ci`, `test:watch`, `preview`, `knip`, `seed`, `db:seed`, `audit:lighthouse`, `audit:lighthouse:check` |
| `apps/admin_system`           | `admin-system`            | `typegen`                                                                                                              |
| `apps/api-server`             | `car-sales-api`           | `seed`, `db:seed`, `start`                                                                                             |
| `apps/api-server-fast`        | `car-sales-api-fast`      | `seed`, `db:seed`, `start`                                                                                             |
| `apps/scan-orchestrator`      | `@repo/scan-orchestrator` | `start`, `test:unit`, `test:coverage`                                                                                  |
| `apps/shared`                 | `api-shared`              | `build`, `test`                                                                                                        |
| `packages/ui`                 | `@lcabrera/ui`            | `check:public-api`, `test:coverage`, `bench`                                                                           |
| `packages/server`             | `@lcabrera/server`        | `test:coverage`                                                                                                        |
| `packages/scan-ingestion`     | `@repo/scan-ingestion`    | `migrate`, `push`, `test:unit`, `test:coverage`                                                                        |
| `packages/node-runtime`       | `@lcabrera/node`          | `build`, `test:coverage`                                                                                               |
| `packages/agent-runner`       | `@repo/agent-runner`      | —                                                                                                                      |
| `packages/ts-configs`         | `@repo/ts-configs`        | `generate`                                                                                                             |
| `packages/tsconfig`           | `@lcabrera/tsconfig`      | `build`, `test:coverage`                                                                                               |
| `packages/eslint-local-rules` | `@lcabrera/eslint-plugin` | —                                                                                                                      |
| `packages/scan-report`        | `@repo/scan-report`       | `test`, `test:coverage`                                                                                                |
| `packages/utils`              | `@lcabrera/utils`         | —                                                                                                                      |
| `packages/vite-configs`       | `@lcabrera/vite-config`   | `build`, `test`, `test:coverage`                                                                                       |

Notes on the non-obvious ones:

- **`packages/ui` → `check:public-api`** guards the public API graph against
  server-only `node:*` imports. It runs as part of `lint`/`lint:check`/`typecheck`,
  which is how `typecheck:all` enforces it in CI.
- **`packages/ts-configs` → `generate`** rewrites every `tsconfig.app.json` /
  `tsconfig.node.json` in the repo. These are **generated artifacts — never
  hand-edit them**; a hand-edit survives only until the next regeneration
  silently reverts it. Always follow `generate` with `vp fmt .`. The factories
  and the writer it calls are the published `@lcabrera/tsconfig`
  (`packages/tsconfig`); what stays in `packages/ts-configs` is this repo's own
  entry table, which is why the task lives there and not in the package
  ([ADR-069](docs/decisions/ADR-069-publish-the-shared-toolchain.md)).
- **A workspace with real-Postgres tests must split them**: keep the full suite as
  `test`, and expose a DB-free `test:unit` (plus `test:coverage`) — otherwise the
  whole workspace drops out of `test:ci` and takes its pure tests with it.
  `scan-ingestion` and `scan-orchestrator` are the precedent.

---

## 6. What CI runs

[`.github/workflows/check-safe.yml`](.github/workflows/check-safe.yml) — three jobs:

| Job              | Steps                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| **Quality Gate** | `typegen:all` → `vp check` → `vp run typecheck:all` → `vp run -r lint:eslint:check` → `vp run lint:biome:check` |
| **Fallow Audit** | `typegen:all` → `coverage:merge` → `fallow:audit --base <PR base> --coverage …` (PRs only)                      |
| **Unit Tests**   | `vp run test:ci` → `vp run coverage:report` → per-workspace + monorepo coverage matrix comment on the PR        |

Each pass is a **separate step on purpose** so a failure names itself instead of
hiding behind a neighbour. `vp check` does not run the eslint pass, it does not run
Biome, and it does not run `tsc`.

The three jobs run in **parallel** — "Biome runs before Fallow" holds within the
Quality Gate job's step order, not across jobs.

[`deps-audit.yml`](.github/workflows/deps-audit.yml) is the repo's only
**scheduled** workflow: it runs `deps:audit` daily and opens (or comments on) a
single tracking issue when it finds something. The per-PR gate catches what a
change introduces; only the schedule catches an advisory published overnight
against a tree nobody touched.

Other workflows: `lighthouse.yml`, `validate-skills.yml`, and
[`pr-standards.yml`](.github/workflows/pr-standards.yml) — on every pull request
it runs `pr:verify` (title + description) and `commit:verify` over each non-merge
commit in the range, so nothing that skipped the local hook reaches `main`.
[`labeler.yml`](.github/workflows/labeler.yml) auto-labels each PR
(`app:`/`pkg:`/`type:`), [`sync-labels.yml`](.github/workflows/sync-labels.yml)
syncs the label set when the manifest/workspace list changes on `main`, and
[`changelog.yml`](.github/workflows/changelog.yml) publishes release notes on a
`v*` tag. `CHANGELOG.md` itself is regenerated with `vp run changelog:generate`
and committed through an ordinary PR — see
[AGENTS.md § Releasing, Changelog & Labels](AGENTS.md#releasing-changelog--labels)
and the `releasing` skill for why no bot
pushes it to `main`.

[`copilot-review-gate.yml`](.github/workflows/copilot-review-gate.yml) judges the
**review** rather than the code: it publishes the `Copilot review complete`
commit status against the head SHA, green only while Copilot's newest review
names that commit. It is the only workflow here triggered by
`pull_request_review` as well as `pull_request`, because its verdict changes when
the diff has not — a review landing flips it, and a push takes it back to
`pending`. It reports but does not block until #698 makes the context required,
and a run triggered by Copilot's own review currently waits for approval before
it executes — both caveats, and the way out of the second, are in
[`docs/tooling/copilot-review-gate.md`](docs/tooling/copilot-review-gate.md).

[`secret-scan.yml`](.github/workflows/secret-scan.yml) scans repository
**content** for credentials — the layer the two agent-boundary guards
(`scripts/claude-secrets-guard.mjs`, `packages/agent-runner`) do not cover, since
neither looks at what lands in a commit. Two scans: the working tree, and the
commits this PR adds (a secret added then removed within one PR never reaches the
tree, but the branch carrying it was pushed). Config and its single allowlist
entry are in [`.gitleaks.toml`](.gitleaks.toml); the binary is version-pinned and
checksum-verified rather than pulled from a third-party action, because it is a
security control.

[`copilot-setup-steps.yml`](.github/workflows/copilot-setup-steps.yml)
**provisions** rather than judges: GitHub runs its job inside the container the
Copilot coding agent works in, before the agent starts and before its network is
firewalled — so it is the only chance to install anything, and nothing it does
gates another PR. It mirrors the Quality Gate's bootstrap deliberately
(`setup-vp`, then `vp install --frozen-lockfile --ignore-scripts && vp config`),
because an agent bootstrapped differently from CI produces failures nobody can
reproduce. Its job name is load-bearing: GitHub looks for `copilot-setup-steps`
exactly, and renaming it disables the file with no error anywhere. It does appear
as a check, but only on a PR that touches the file itself — both triggers are
path-scoped to it, so the bootstrap is proven in Actions instead of discovered
through an agent failing opaquely inside it.

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
