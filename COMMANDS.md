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

| Source                                        | Example                                                     |
| --------------------------------------------- | ----------------------------------------------------------- |
| `package.json` → `scripts`                    | `packages/ui`'s `typecheck`                                 |
| A shared factory from `@lcabrera/vite-config` | `apps/showcase`'s `test` (via `createReactRouterRunConfig`) |

This is why `grep -l '"test":' apps/*/package.json packages/*/package.json`
finds almost nothing yet `vp run -r test` runs suites nearly everywhere: the
other definitions live in each workspace's `vite.config.ts`, or come from
`packages/vite-configs/src/vite.run.shared.config.ts`.

Useful flags: `-r` (recursive, dependency order), `--filter <name>` (one
workspace, by **package name** not directory), `--parallel`. Note `--filter` and
`-r` **cannot be combined**.

---

## 2. Daily commands

Run from the workspace you are working in (e.g. `apps/showcase/`).

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
`scripts:verify`, `scripts:exits:verify`, `seeds:verify`, `devkit:closure -- --shipped`, `docs:verify`,
`registers:verify`, `package-refs:verify`, `departed:verify`,
`renames:verify`, `route-names:verify`,
`inventory:verify`, `adr:verify`, `viteplus:verify` and `configs:verify`, mirroring the
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
| `vp run typecheck:all`       | real tsc in all 12 workspaces, dependency order                                                   |
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

`test:all` vs `test:ci`: no suite here needs a database, so the two differ only
in ordering — `test:ci` runs
`showcase` last so the PR's coverage summary is the fresh one. Use
`test:ci` before pushing; it is what CI runs.

`test:scripts` is chained into both, and needs to be: root `scripts/` is **not a
workspace**, so `vp run -r test` never reaches it. That is why the logic behind
`commit:verify`, `coordination:verify` and `docs:verify` went untested for as
long as it did — a gate whose decision logic silently stops matching reports
exactly what compliant input reports, which is nothing.

`test:changed` runs only the suites a diff touched, for a fast local loop. It
diffs the working tree against the branch point (`git merge-base` with
`origin/main`; override the base with `TEST_CHANGED_BASE`), maps changed files to
workspaces, and adds every workspace that transitively **depends on** them — so a
`packages/ui` edit still exercises `apps/showcase`. It prints a per-workspace
summary of what runs and what is skipped. Only the few files that change how every
workspace resolves its tests — `pnpm-lock.yaml`, `pnpm-workspace.yaml`, the root
`vite.config.ts`, and the shared `vite-configs`/`ts-configs` packages — force the
full suite (a real dependency change always bumps the lockfile); every other
out-of-workspace change (root package.json scripts, lint/tsconfig configs, docs,
root `scripts/`) affects no suite and runs nothing. Task substitution mirrors
`test:ci`: the scan packages run their DB-free `test:unit`, and with `--ci` (`node
scripts/test-changed.mjs --ci`) `showcase` runs its coverage `test:ci`
last. `--dry-run` prints the `vp run` commands without executing them. CI's Unit
Tests job (and its coverage report) scope to the diff on pull requests; pushes to
`main` still run the full `test:ci`.

`typecheck:changed` applies the same change-based selection to the Quality Gate's
slowest per-workspace step — real `tsc` across all 12 workspaces. It runs
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

**It moves `.node-version` too**, and the commit and PR say so rather than listing
it among the packages. CI resolves the runtime from that pin, so the gate runs on
the new Node before the PR can merge; local checkouts do not inherit it, because
the vp shim is system-first. After a refresh that moved the pin, install that Node
and repoint your default — otherwise your pre-push gate runs a different runtime
than CI does.

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

| Command                 | Runs                                             |
| ----------------------- | ------------------------------------------------ |
| `vp run dev:showcase`   | the showcase frontend — Postgres is all it needs |
| `vp run start:showcase` | the built showcase                               |

Every table route in `apps/showcase` serves its own rows from Postgres, so
the showcase needs nothing but a database — see
[the app's data-sources doc](apps/showcase/docs/data-sources.md).

**`start:showcase` additionally needs the two auth variables set**, and
`dev:showcase` does not. `@react-router/serve` defaults `NODE_ENV` to
`production`, which is outside the modes where the published auth defaults
apply, so the first request touching auth refuses until `AUTH_TOKEN_SECRET` and
`AUTH_DEMO_PASSWORD_HASH` are set. The app's tracked env example says what to
put in them.

**The external-API lane still exists, and nothing in this repository serves it.**
Setting `VITE_API_URL` points the same routes at an external server instead of
this app's own loaders. To exercise it you supply that server: it must serve the
paginated row and filter-option endpoints the routes call, over the column lists
in `apps/showcase/src/routes/*/config/`, which are the contract
([the app's data-sources doc](apps/showcase/docs/data-sources.md) describes
both transports). No such server ships from here, and the lane is not needed to
run the showcase — every table route reads Postgres in process. (An app-level
`.env` is loaded after the variable is exported, so one that sets `VITE_API_URL`
itself wins — that is the local override of the local override, and it is
deliberate.)

### Database

| Command                            | Does                                    |
| ---------------------------------- | --------------------------------------- |
| `vp run db:up`                     | start local Postgres                    |
| `vp run db:status`                 | container status                        |
| `vp run db:down`                   | stop it                                 |
| `vp run --filter showcase seed`    | create + seed the showcase's own tables |
| `vp run --filter showcase db:seed` | bring up + seed                         |

`seed` and `db:seed` are **workspace scripts, not root scripts** — they need the
`--filter` (or run them from the workspace directory). **Each side owns its own
DDL and its own runner**
([ADR-071](docs/decisions/ADR-071-split-the-demo-database-setup.md)): the
showcase's is `apps/showcase/db/`, applied through `pg` so it needs only
Docker and Node. Seeding the showcase is what creates `enterprise_orders`. It
reads env from `docker/local/.env` and then the workspace's own `.env`; the
frontend proxies `/api` to `http://localhost:3001` for the external-API lane.

### Fallow static analysis

Configured once at the repo root (`.fallowrc.json`); it auto-detects every
workspace. Scope any of these with `-w`, e.g. `-w 'apps/showcase'`. Full
policy — entry rules, the CRAP/coverage trap, output conventions — is in
[AGENTS.md → Fallow Static Analysis](AGENTS.md#fallow-static-analysis-run-from-repo-root).

| Command                        | Does                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| `vp run fallow:full`           | full scan                                                              |
| `vp run fallow:dead-code`      | dead code only                                                         |
| `vp run fallow:health`         | complexity / health                                                    |
| `vp run fallow:dupes`          | duplication                                                            |
| `vp run fallow:audit`          | PR-style gate (`--base main`)                                          |
| `vp run fallow:refresh-report` | regenerate the complexity threshold report                             |
| `vp run fallow:report`         | full scan + `fallow.raw.json` in a timestamped run dir; echoes the dir |

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

**Which packages these watch is `publishing.publicPackageDirs` in
[`devkit.config.json`](devkit.config.json)**, not a list inside the gate: they
run from `@lcabrera/repo-standards`, which ships to other repositories and cannot
carry this one's roster. A new public package is added there in the same commit
as its manifest — until it is, its surface is not under the ratchet and nothing
says so. Deleting the roster does not quietly disable them: both gates refuse an
empty one rather than passing over nothing.

### Releasing a package

Versions are chosen by people, bumped by one command, and published by CI.

| Command                  | Does                                                                          |
| ------------------------ | ----------------------------------------------------------------------------- |
| `vp run release:add`     | write a changeset — pick the packages and patch/minor/major, say what changed |
| `vp run release:audit`   | read the manifests already on npm and check what a consumer would get         |
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

### Auditing the published manifests

`publish:verify` answers "is the tarball this repo would produce correct?".
`release:audit` answers the other one — "is what is **already on npm** still
correct?" — by fetching each published manifest and checking it.

```bash
vp run release:audit                                  # every published version
vp run release:audit -- @lcabrera/eslint-plugin       # one package
vp run release:audit -- @lcabrera/eslint-plugin@0.1.0 # one version
```

Two questions asked of every version: does an `exports` target point inside
`src` (in a package this repo _builds_ — `@lcabrera/ui` ships source on purpose),
and does any dependency range still carry `catalog:` or `workspace:`? The second
is what makes a package uninstallable: npm has no handler for either protocol and
aborts with `EUNSUPPORTEDPROTOCOL` before it ever reads `exports`.

Nothing else here can see this. `publish:verify` packs with pnpm — it must,
since the `publishConfig.exports` swap is a pnpm extension (ADR-073) — so a
defect that exists only in an `npm pack` tarball is invisible to it permanently.
That is how `@lcabrera/eslint-plugin@0.1.0` shipped uninstallable with every gate
in this repo green (#730).

**It observes drift; it cannot prevent it.** A hand-publish reaches the registry
without passing through anything here, and a green `release:audit` says the
registry was correct when it was read — not that it cannot drift. An npm version
is immutable, so a finding is resolved by publishing a corrected version and
`npm deprecate`-ing the broken one; the audit then reports that version without
failing, unless a dist-tag still points at it. It runs on a schedule rather than
per PR, because the registry is not a property of a pull request and no commit
can repair an artifact that already shipped —
[ADR-077](docs/decisions/ADR-077-audit-every-published-version-and-report-rather-than-block.md)
records both decisions.

An unreachable registry **fails**, and so does a run that resolved **no**
manifest at all — a registry answering 404 to everything (a proxy, a wrong
`npm_config_registry`, an auth failure serving 404 rather than 401) would
otherwise print every package as "not on npm" and exit 0. A single 404 is still
tolerated, because that is how a package awaiting its first publish presents;
what fails is asking about packages and resolving none of them. A supply-chain
check that reports clean because it could not run is worse than none, because it
is believed — the same property [`deps:audit`](#dependencies) is built around.

### AI config & skills tooling

| Command                       | Does                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vp run commands:verify`      | check this file still matches reality                                                                                                                                                                                                                                                |
| `vp run scripts:verify`       | check `.mjs`/`.cjs` size ceiling (`--write` rebaselines)                                                                                                                                                                                                                             |
| `vp run scripts:exits:verify` | fail any `.mjs`/`.cjs` calling `process.exit()` instead of setting `process.exitCode`                                                                                                                                                                                                |
| `vp run seeds:verify`         | check no file `packages/devkit` ships names this repository — its package names, its secrets or its task runner; the forbidden words are derived from the repository, so a new workspace is covered the day it is added                                                              |
| `vp run lint:plugins:verify`  | prove every Oxlint plugin family is loaded, that no workspace config shadows the root ([ADR-042](docs/decisions/ADR-042-oxlint-config-at-the-root.md)), and that the Oxlint and Biome workspace rosters each classify every workspace exactly once                                   |
| `vp run lint:eslint:verify`   | prove the **eslint** pass still runs its rules — plants a misordered import and requires `perfectionist/sort-imports` to report it (#472)                                                                                                                                            |
| `vp run suppressions:verify`  | check the four public packages carry no unapproved suppression (see [the protocol](docs/agents/public-package-suppressions.md))                                                                                                                                                      |
| `vp run suppressions:list`    | print every suppression reaching a public package, approved or not                                                                                                                                                                                                                   |
| `vp run docs:verify`          | check every documented repository path resolves (`--write` prunes resolved baseline entries; `--accept <doc> <ref> --reason "…"` grandfathers one)                                                                                                                                   |
| `vp run package-refs:verify`  | check no published package's docs name one of this repo's apps                                                                                                                                                                                                                       |
| `vp run departed:verify`      | check nothing names a product or workspace that left this repository — the roster is [`scripts/departed-names.json`](scripts/departed-names.json)                                                                                                                                    |
| `vp run renames:verify`       | check no document still names a file this change renamed away — scoped to the diff, which is what lets it check bare filenames at all (`--base <ref>`, default `origin/main`)                                                                                                        |
| `vp run route-names:verify`   | check every `*.types`/`*.constants` file in a route folder names an artifact that folder holds — the half of `local-rules/domain-folder-filename` an ESLint rule cannot reach (#613)                                                                                                 |
| `vp run inventory:verify`     | check every `*.util.ts`/`*.util.tsx` value export (`export const`/`export function`; type-only exports are out of scope) is named (in backticks) somewhere in its tree's own `INVENTORY.md` (`--write` regenerates `scripts/inventory-drift-baseline.json`, reviewed as a JSON diff) |
| `vp run adr:verify`           | check ADR home, filename, heading, number uniqueness, each home's index, and each record's `governs` block and required sections; prints the next free number (`--write` prunes the baseline and regenerates the indexes; `--adopt` writes the baseline once)                        |
| `vp run adr:new`              | scaffold an ADR from [`_TEMPLATE.md`](docs/decisions/_TEMPLATE.md) with the next free number — `-- "<title>" [--home repo\|app] [--slug <s>] [--dry-run]`                                                                                                                            |
| `vp run adr:list`             | print every ADR with its title, per home — the listing each home's index deliberately does not carry ([ADR-075](docs/decisions/ADR-075-the-index-does-not-list-the-adrs.md)); `-- --package <workspace-directory-name>` narrows it to the decisions governing one                    |
| `vp run devkit:sync`          | materialise the shipped files into this repository from [`packages/devkit`](packages/devkit/CLASSIFICATION.md) — a locally modified file is reported and kept, never overwritten; `-- --profile full` also places the workflows, hooks, templates and registers                      |
| `vp run devkit:doctor`        | report what differs between the materialised copies and the package; `-- --check` fails on a difference, `-- --verbose` also lists acknowledged edits, `-- --profile <name>` reads a profile other than the configured one, `-- --accept <path> --reason "…"` acknowledges ONE       |
| `vp run devkit:closure`       | measure what a directory references but does not contain — `-- <dir> [<dir> ...]`, or `-- --shipped` for every file the package places, in every profile (`-- --profile <name>` narrows it to one); the instrument behind the classification table                                   |
| `vp run devkit:check`         | fail when this repository's materialised copies differ from the package — the drift gate, since consuming the kit's own output is only a guarantee if something checks it                                                                                                            |
| `vp run tarball:verify`       | pack both distributed packages, install them into a scratch repository outside this tree, and run every declared bin — the only check that sees what a consumer actually receives                                                                                                    |
| `vp run viteplus:verify`      | check AGENTS.md has no Vite+ managed block rendering content — the markers are removed so `vp install` cannot refill them; this catches them coming back (`--write` re-empties a refilled one)                                                                                       |
| `vp run configs:verify`       | check no formatter/linter config file exists that no engine reads — fmt and lint are configured once in the root `vite.config.ts` (ADR-042), so a `.oxfmtrc.json`/`.prettierrc` beside it is a decoy                                                                                 |
| `vp run skills:validate`      | validate skill definitions                                                                                                                                                                                                                                                           |
| `vp run skills:report`        | skills compliance report                                                                                                                                                                                                                                                             |
| `vp run prepare`              | `vp config` — runs automatically on install                                                                                                                                                                                                                                          |

`adr:verify` reads the record, not only its name. Every ADR opens with a
`---` block declaring **`governs`** — workspace directory names (`ui`,
`node-runtime`, never npm names), or the single value `repository` when the
decision constrains no one workspace. The two do not mix, and the list is never
empty: "governs everything" and "nobody filled this in" must not be spelled the
same way. The gate also requires `## Context`, `## Decision`, `## Consequences`
and at least one of `## Options considered` / `## Alternatives considered` to be
present and **not empty** — a heading whose only content is the template's own
prompt counts as empty. It does not judge what a section says, and its success
line says so.

**The block is additive classification, not an amendment.** An ADR is a dated
record and its body is never rewritten; `governs` says what the decision applies
to, which is a fact about the tree you are standing in rather than a change to
what was decided. That is why adding one to an old ADR is allowed while editing
its body is not.

The records that predate the block are grandfathered in
[`scripts/adr-content-baseline.json`](scripts/adr-content-baseline.json), and
that list may **shrink but not grow**. Growth is decided by the list's size, not
by any record's number: `maxEntries` is the most entries the baseline may hold,
so a list longer than its own bound is a finding whatever the added entry is
called. A number window would not do this — a sequence has gaps, and a record
taking a retired number falls inside any window.

What holds that direction, and what does not — the second list is the one worth
reading, because a bound is easy to believe more of than it delivers:

- **Shut: appending an entry.** The list is then longer than its own bound.
- **Shut: swapping one entry for another.** The record dropped out of the list is
  no longer grandfathered and reports its own findings.
- **Shut: `--write`.** It only prunes, lowers `maxEntries` to what it kept —
  never raises it — and refuses outright to rewrite a baseline that has already
  grown, so it cannot launder a hand-added entry into one the next run calls
  clean. An entry naming no record, or one whose record now satisfies the rules,
  is a finding until it is dropped.
- **Open: deleting the baseline and running `--adopt` again.** It refuses a
  baseline that _exists_; it cannot refuse one that has been removed, and nothing
  in the tree remembers there was one. Re-adoption grandfathers whatever fails at
  that moment, new records included.
- **Open: raising `maxEntries` by hand.** Nothing in a tracked file could prevent
  it.

Both open doors move `maxEntries`, and that is what the bound actually buys:
reopening grandfathering is one number changing in a diff rather than one line
appended to a list of seventy that read alike.

A grandfathered record is unclassified, so `adr:list -- --package` cannot see it,
and both commands print how many are in that state rather than letting an empty
listing read as "no decisions govern this package".

`devkit:doctor -- --accept` takes **one** file at a time and refuses a path the
report does not currently call `modified` or `conflict`, or a missing `--reason` — the same
discipline `docs:verify -- --accept` keeps, for the same reason. It records the
edit's on-disk hash in `.devkit-accepted.json`, which is **tracked**: commit it
alongside `.devkit-manifest.json`. Because the record is keyed to that hash,
editing the file again re-reports it with no further command, and reverting to
the acknowledged content quiets it again. Withdraw one by deleting its entry.

### Product & planning registers

The requirement register under
[`docs/product/requirements/`](docs/product/requirements/) and the planning
documents under [`docs/agents/planning/`](docs/agents/planning/README.md) are
frontmatter, so a script can read them. These three commands are what read them.

| Command                   | Does                                                                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vp run registers:verify` | the gate — fails a malformed entry, a duplicate id, an evidence pointer that resolves to nothing, a `requires` cycle, a package name no workspace answers to, a `met` requirement with no command CI runs, and a plan naming no issue |
| `vp run product:distance` | print how far the product is from its intent — met against unmet, by product line, persona and package, then every unmet requirement with the issues that would move it. Writes nothing                                               |
| `vp run docs:for-package` | print every document that declares one workspace in its `packages:` field, from both registers — `-- <workspace-directory-name>`, e.g. `-- node-runtime`. Writes nothing, reads nothing but the working tree                          |

`registers:verify` **refuses to pass having read no entries**: an empty register
and a clean one are otherwise the same exit code, which is the failure every
gate in this file exists to avoid.

It also checks **half** of one rule, and its success line says so. A requirement
declaring `met` must point at a `command` that CI runs **and that could fail**;
"CI runs it" is derivable from the workflows and the root manifest, and
"it could fail" is not derivable from anything in the tree. That half stays a
procedure for the author and the reviewer — break the property on purpose, watch
the pointer fail, then write `met`
([`docs/product/README.md`](docs/product/README.md)). A check that appeared to
cover it would be the exact defect the register exists to expose.

Drafts are out of scope. `docs/agents/planning/adr-drafts/` holds proposed ADRs,
which carry no block by charter, so the gate requires none of one — while still
holding any block a file there does declare to the schema
([`docs/agents/planning/README.md`](docs/agents/planning/README.md)).

Neither report writes a file. A distance is a measurement, and a measurement in
a tracked file is right on the day it is written and wrong from the next commit
([ADR-049](docs/decisions/ADR-049-findings-reports-are-produced-on-demand.md)) —
redirect stdout into a PR or an issue, where it is dated. `product:distance`
**resolves** every evidence pointer and runs none of them, and says which it did
in its own output.

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
spec ([`packages/repo-standards/scripts/commit-convention.mjs`](packages/repo-standards/scripts/commit-convention.mjs)).
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

Two checks that judge the **review** rather than the code, and so are recomputed
by review and head-commit events rather than by the gate command. One mechanism,
two subjects: has an accepted reviewer reviewed _this_ head, and does a valid
agent-review verdict exist for _this_ head?

`Copilot review complete` is a commit status that is green only while some
**accepted reviewer's** own newest review names the pull request's **current head
commit** — a review of a superseded commit looks identical in the UI to a review of
the head, which is how a PR reaches a mergeable state unreviewed. Two reviewers are
accepted, named in
[`scripts/lib/copilot-review.mjs`](scripts/lib/copilot-review.mjs); the context
keeps its original name.
[`copilot-review-gate.yml`](.github/workflows/copilot-review-gate.yml) recomputes
it on every push and every review; the command below is the same comparison run
by hand. The states and the break-glass path are in
[`docs/tooling/copilot-review-gate.md`](docs/tooling/copilot-review-gate.md).

| Command                                              | Does                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `vp run copilot-review:status -- --pr <n> --dry-run` | print the state the gate would publish for a PR, posting nothing |
| `vp run copilot-review:status -- --pr <n>`           | publish that state against the PR's current head commit          |

**Publishing this one from a checkout is a trap, and it is the command most
likely to be reached for.** `Copilot review complete` is a required context
pinned to `integration_id` 15368, so a status you post yourself does not satisfy
it — and it leaves the head carrying the state and description the scheduled
sweep computes, after which the sweep withholds and no app-backed status arrives
either. Use `--dry-run` to read the verdict; dispatch **Copilot Review Gate** to
publish one that counts. Break-glass rung 3 in
[`docs/tooling/copilot-review-gate.md`](docs/tooling/copilot-review-gate.md)
owns the mechanism and its exceptions.

That gate also reports the findings Copilot **suppressed** — the low-confidence
ones it puts in the review body instead of filing as threads, which conversation
resolution therefore never sees. They are reported and never block
([ADR-078](docs/decisions/ADR-078-surface-suppressed-comments-without-blocking.md));
the command below is the same read on demand, and the four answers it can give —
including the two different zeros — are in
[`docs/tooling/copilot-review-gate.md`](docs/tooling/copilot-review-gate.md).

| Command                                        | Does                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| `vp run copilot-review:suppressed -- --pr <n>` | list every suppressed Copilot finding on a PR; exits 1 if it could not read |

`Agent review verdict` reads the verdict posted for a pull request's current head
and validates it against
[`docs/agents/agent-review-contract.md`](docs/agents/agent-review-contract.md)
§2.4 — parse, schema, head binding, admissibility, consistency — reporting
`pass`, `fail`, `error` or `absent`. **It runs no model:** the repo-aware review
happens locally under `/epic` and `/refactor-verified`, and this checks the
document that review produced. `.github/workflows/agent-review-verdict.yml` runs
the same script on every pull request, advisory for now (#697; promoting it is
#698).

| Command                                            | Does                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| `vp run agent-review:verify -- --pr <n>`           | validate the verdict on a PR and publish the advisory commit status        |
| `vp run agent-review:verify -- --pr <n> --dry-run` | the same, reported to the terminal without touching the commit status      |
| `vp run agent-review:verify -- --pr <n> --strict`  | exit with the contract's §2.3 codes (0 pass, 1 fail, 2 error) instead of 0 |

A third gate reports the **review threads** still holding a pull request. The
`main` ruleset sets `required_review_thread_resolution`, so one open thread
blocks the merge and nothing says so once the checks are green — #780 sat 70
minutes that way. The rule it reports on is
[`docs/agents/pr-review-threads.md`](docs/agents/pr-review-threads.md).

| Command                                              | Does                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `vp run pr:threads`                                  | list unresolved threads on the current branch's PR; non-zero if any   |
| `vp run pr:threads -- --pr <n>`                      | the same for one PR, with each thread's node id                       |
| `vp run pr:threads -- --pr <n> --json`               | the same as JSON                                                      |
| `vp run pr:threads -- --resolve <thread-id>`         | resolve one thread, after you have fixed or answered it               |
| `vp run review-threads:verify -- --pr <n>`           | publish the advisory `Review threads resolved` status                 |
| `vp run review-threads:verify -- --pr <n> --dry-run` | the same, reported to the terminal without touching the commit status |

No gate's trigger is reliable here — a Copilot review usually creates no
workflow run, and the agent-review verdict arrives as a bot-authored comment,
the same class (#737). So one **reconcile** republishes every status for every
open pull request on a schedule, and the command below is that same sweep run by
hand. It posts only when the head does not already carry the verdict it computes,
so running it twice changes nothing.
[`.github/workflows/review-gate-reconcile.yml`](.github/workflows/review-gate-reconcile.yml)
is the schedule; the interval, the recovery and what it does on failure are in
[`docs/tooling/review-gate-reconcile.md`](docs/tooling/review-gate-reconcile.md)
([ADR-076](docs/decisions/ADR-076-reconcile-the-review-gate-statuses-on-a-schedule.md)).

| Command                                               | Does                                                   |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `vp run review-gates:reconcile`                       | republish every status for every open PR that needs it |
| `vp run review-gates:reconcile -- --pr <n>`           | the same for one PR                                    |
| `vp run review-gates:reconcile -- --pr <n> --dry-run` | print what it would publish, posting nothing           |

**Any status posted from a checkout is posted as you, not as a workflow**, so
none of them satisfies `Copilot review complete` — these two forms and
`copilot-review:status` above alike. A locally-posted **`success`** is the one to
avoid:
the sweep withholds when the state and description it computes match what is
already posted, and for this gate it never weakens a `success` (#868) — so the
bar can stop being cleared by an app-backed status, on every open pull request at
once in the bare form. A locally-posted `pending` is harmless; the sweep
publishes over it as Actions once a review lands. Break-glass rung 3 in
[`docs/tooling/copilot-review-gate.md`](docs/tooling/copilot-review-gate.md)
owns the mechanism and its exceptions; to clear the gate, dispatch **Copilot
Review Gate**.

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

**Every one of the 12 workspaces** defines these seven:

`format` · `format:check` · `lint` · `lint:check` · `lint:eslint` ·
`lint:eslint:check` · `typecheck`

Beyond that, tasks are per-workspace. `build` and `test` are common but come from
`vite.config.ts` rather than `scripts` in most workspaces (see §1).

| Workspace                     | Package name               | Notable extra tasks                                                                                                    |
| ----------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `apps/showcase`               | `showcase`                 | `typegen`, `test:ci`, `test:watch`, `preview`, `knip`, `seed`, `db:seed`, `audit:lighthouse`, `audit:lighthouse:check` |
| `packages/ui`                 | `@lcabrera/ui`             | `check:public-api`, `test:coverage`, `bench`                                                                           |
| `packages/server`             | `@lcabrera/server`         | `test:coverage`                                                                                                        |
| `packages/node-runtime`       | `@lcabrera/node`           | `build`, `test:coverage`                                                                                               |
| `packages/ts-configs`         | `@repo/ts-configs`         | `generate`                                                                                                             |
| `packages/tsconfig`           | `@lcabrera/tsconfig`       | `build`, `test:coverage`                                                                                               |
| `packages/eslint-local-rules` | `@lcabrera/eslint-plugin`  | —                                                                                                                      |
| `packages/devkit`             | `@lcabrera/devkit`         | `test`, `test:coverage`                                                                                                |
| `packages/repo-standards`     | `@lcabrera/repo-standards` | `test`, `test:coverage`                                                                                                |
| `packages/utils`              | `@lcabrera/utils`          | —                                                                                                                      |
| `packages/vite-configs`       | `@lcabrera/vite-config`    | `build`, `test`, `test:coverage`                                                                                       |

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
  Nothing needs this today, but the machinery is still wired.

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

[`deps-audit.yml`](.github/workflows/deps-audit.yml) is **scheduled**: it runs
`deps:audit` daily and opens (or comments on) a single tracking issue when it
finds something. The per-PR gate catches what a change introduces; only the
schedule catches an advisory published overnight against a tree nobody touched.

[`release-audit.yml`](.github/workflows/release-audit.yml) is scheduled for the
same reason, one subject over: it runs `release:audit` daily against the
registry and files the same kind of tracking issue. Its subject moves without
anyone touching this repository — a hand-publish never passes through CI — and
an immutable broken version cannot be fixed by a commit, so it deliberately does
not gate a pull request ([ADR-077](docs/decisions/ADR-077-audit-every-published-version-and-report-rather-than-block.md)).

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
commit status against the head SHA, green only while some accepted reviewer's own
newest review names that commit. It is the only workflow here triggered by
`pull_request_review` as well as `pull_request`, because its verdict changes when
the diff has not — a review landing flips it, and a push takes it back to
`pending`. It is a required context (2026-08-21), so it blocks the merge. A run
triggered by Copilot's own review currently waits for approval before it
executes; that caveat, and the way out of it, are in
[`docs/tooling/copilot-review-gate.md`](docs/tooling/copilot-review-gate.md).

[`claude-review.yml`](.github/workflows/claude-review.yml) is what produces the
second of those reviews. On every non-draft pull request it runs a model over the
diff, has it write the review to a file, and submits that file as a `COMMENT`
review from an ordinary shell step — the model is never handed a tool that can
write to GitHub. It publishes **no** commit status, deliberately: two writers to
one context can disagree about the head, which is the failure the gate exists to
make visible, so publication stays single-writer in
[`copilot-review-status.mjs`](scripts/copilot-review-status.mjs). It is the only
job here that spends model tokens, which is why it skips drafts, bounds itself with
`timeout-minutes`, and cancels superseded runs.

[`agent-review-verdict.yml`](.github/workflows/agent-review-verdict.yml) runs
`scripts/verify-agent-review.mjs` on every pull request and on every comment made
on one, publishing an `Agent review verdict` commit status. It **validates** the
verdict the repo-aware reviewer already posted; it runs no model and needs no
model credential. The `issue_comment` trigger is what lets a verdict posted after
the last push refresh a check that reported `absent` — and, because GitHub runs an
`issue_comment` workflow from the default branch, that half only works once the
file is on `main`. The status is pinned to `success` while the check is advisory,
so the state lives in its description; promoting it is #698.

[`review-gate-reconcile.yml`](.github/workflows/review-gate-reconcile.yml) is the
other **scheduled** workflow, and it serves both of the gates above: half-hourly
it republishes their statuses for every open pull request, because the review and
comment events those gates depend on are not delivered reliably here (#737). It
is not the polling `copilot-review-gate.yml` rejects — it holds nothing open and
carries no SHA across an I/O boundary; the distinction, the interval and the
tracking issue it files when it fails are in
[`docs/tooling/review-gate-reconcile.md`](docs/tooling/review-gate-reconcile.md).
All three review-gate workflows also take a `workflow_dispatch` with a PR number,
which is the break-glass path.

[`secret-scan.yml`](.github/workflows/secret-scan.yml) scans repository
**content** for credentials — the layer the agent-boundary guard
(`scripts/claude-secrets-guard.mjs`) does not cover, since it does not look at
what lands in a commit. Two scans: the working tree, and the
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

`.vite-hooks/commit-msg` runs `node packages/repo-standards/scripts/verify-commit-msg.mjs "$1"`, validating
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

| Symptom                                       | Do this                                                            |
| --------------------------------------------- | ------------------------------------------------------------------ |
| Setup / runtime / package-manager looks wrong | `vp env doctor` — include its output when asking for help          |
| Can't find where a task is defined            | Check all three sources in §1, not just `package.json`             |
| `--filter` errors out                         | It cannot be combined with `-r`; and it takes the **package name** |
| Every regenerated tsconfig looks dirty        | You skipped `vp fmt .` after `generate` — it is whitespace only    |
