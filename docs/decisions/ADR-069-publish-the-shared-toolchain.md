# ADR-069 — The shared toolchain publishes, and the repo data it carries becomes configuration

**Status:** Accepted · **Date:** 2026-08-14 · **Issue:** #673 · **Parent:** #672

## Context

These workspaces carry the toolchain every other workspace depends on, and none
of them can leave this repository. Reverse dependencies were enumerated from the
workspace manifests on 2026-08-14
(`grep -rn '"@repo/' --include=package.json apps packages`):

| Workspace               | Consumers today                                                     |
| ----------------------- | ------------------------------------------------------------------- |
| `packages/vite-configs` | every app and every package                                         |
| `packages/ts-configs`   | the generator that writes every workspace's tsconfig                |
| `packages/plugins`      | `packages/vite-configs` only                                        |
| `packages/node-runtime` | `apps/api-server`, `apps/api-server-fast`, `apps/scan-orchestrator` |

The CQMS extraction (#672) forces the question but is not the reason to answer
it. The reason is that this toolchain is the most reused thing in the repo and
the only part of it that cannot be reused _outside_ the repo. A second
repository built on these conventions has two options today: copy the files, or
do without.

[ADR-040](ADR-040-npm-scope-for-the-public-packages.md) says the scope answers
one question — _does it ship?_ — and `@repo/*` was the honest answer while the
only consumer was this monorepo. It stopped being the honest answer for all four
the moment a second repository needed them.

[ADR-057](ADR-057-publish-the-custom-lint-rules.md) is the same decision one
package earlier: two rules hardcoded this repo's conventions, both became
options with our values as defaults, in-repo behaviour was unchanged, and the
package shipped. This ADR repeats that pattern at a larger scale.

## Problem

The obstacle is not packaging. It is that each package mixes generic machinery
with this repository's own data, so publishing as-is would impose our shape on
every consumer.

#673 named some of these sites. Reading the sources on 2026-08-14 found more, and
the ones it missed — marked **no** below — matter because each would otherwise
have been discovered mid-implementation:

| Site                                                   | The repo data                                                                                                            | Named in #673 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `packages/ts-configs/tsconfig.entries.ts`              | this repo's workspace roster and per-app `paths`                                                                         | yes           |
| `packages/vite-configs/vite.plugins.shared.config.ts`  | a StyleX alias mapping `@lcabrera/ui/*` to `../../../packages/ui/src/*`                                                  | yes           |
| `packages/vite-configs/eslint.restrictions.shared.mjs` | `@lcabrera/ui` / `@lcabrera/server` import-boundary tables                                                               | yes           |
| `packages/vite-configs/vite.lint.shared.config.ts`     | `BROWSER_WORKSPACES` / `NODE_WORKSPACES` / `RUNTIME_AGNOSTIC_WORKSPACES`, this repo's whole workspace roster by glob     | **no**        |
| `packages/vite-configs/vite.run.shared.config.ts`      | `LOAD_LOCAL_ENV`, which reads `../../docker/local/.env` — this repo's dev-compose layout                                 | **no**        |
| `packages/vite-configs/package.json`                   | every dependency declared `devDependencies`, plus ESLint plugins `./eslint-custom-rules` needs that are declared nowhere | partly        |

The third row is also wrong in the other direction. #673 says
`eslint.restrictions.shared.mjs` "is entirely `@lcabrera/ui`/`@lcabrera/server`
boundary enforcement" and therefore does not ship. It is not. Most of what it
exports is generic house style naming no workspace —
`BARREL_SYNTAX_RESTRICTIONS`, `REACT_TYPE_IMPORT_PATHS`,
`STATE_LIBRARY_IMPORT_PATTERNS` and `TEST_RUNNER_IMPORT_PATTERNS` — and the last
of those is imported by `eslint.base-custom-rules.shared.config.mjs`, which _is_
the generic `./eslint-base-custom-rules` export. Leaving the whole file behind
would ship a config that cannot load.

## Decision

**Four packages publish**, all `@lcabrera/*`, all under the publishing contract
in [`packages/CLAUDE.md`](../../packages/CLAUDE.md).

| Source                                                     | Rename or split                    | Published as            | Implemented by |
| ---------------------------------------------------------- | ---------------------------------- | ----------------------- | -------------- |
| `packages/ts-configs` — its factories and writer only      | **split** — the workspace survives | `@lcabrera/tsconfig`    | #674           |
| `packages/vite-configs`, with `packages/plugins` folded in | rename                             | `@lcabrera/vite-config` | #675           |
| `packages/node-runtime`                                    | rename                             | `@lcabrera/node`        | #676           |
| the three scan-report skills' shared scripts               | new package                        | `@lcabrera/scan-report` | #677           |

**Read the first row as a split, not a rename — it is the only one.**
`packages/ts-configs` does not _become_ `@lcabrera/tsconfig`; part of it does. The
workspace survives the change, still named `@repo/ts-configs` and still
`private: true`, holding the repo data the published half must not carry. The
other rows are renames: those workspaces become the published package, and what
repo data they carry leaves for a repo-owned home rather than for a surviving
private workspace.

`packages/plugins` does not publish under its own name (see below), and no
manifest changes under this issue — the ADR is the deliverable.

### `packages/ts-configs` splits: the factories ship, the entry table stays

The seam is already physical, which is what makes this the one clean split.
`tsconfig.shared.ts` holds the `createAppTsConfig` / `createNodeTsConfig`
factories and is generic: it names no workspace, and every mention of
`@lcabrera/*` in it is illustrative JSDoc. `generate.ts` is a thin writer around
`mkdir` + `writeFile`, also generic.

**Ships as `@lcabrera/tsconfig`:** both factories and the writer.

**Stays behind in `@repo/ts-configs`:** `packages/ts-configs/tsconfig.entries.ts`
— nothing but this repo's workspace list and per-app `paths`. Its own header
comment already says it is kept apart from the generator deliberately.

So #674 leaves two artifacts with similar names, and telling them apart matters:

|                 | `@lcabrera/tsconfig`          | `@repo/ts-configs`                                        |
| --------------- | ----------------------------- | --------------------------------------------------------- |
| What it is      | the published package         | the private workspace that survives the split             |
| Holds           | both factories and the writer | `tsconfig.entries.ts` plus a runner that calls the writer |
| `private`       | `false`                       | `true`                                                    |
| Who consumes it | this repo, and any other repo | nothing — it is a task host, not a library                |

`generate.ts` imports `./tsconfig.entries.ts` statically today, so the writer has
to take the entry list as an argument before the halves can separate. Once it
does, `vp run --filter @repo/ts-configs generate` keeps working **unchanged** —
that is the surviving workspace's own task, deliberately, so the entry table
keeps a home that is neither a root script nor a published file and no caller has
to learn a new command.

### `@lcabrera/vite-config` ← `packages/vite-configs`, with `packages/plugins` folded in

**Ships:** every subpath the package exports today — `./fmt`, `./lint`, `./pack`,
`./plugins`, `./run`, `./eslint-custom-rules`, `./eslint-base-custom-rules`
(`node -e "console.log(Object.keys(require('./packages/vite-configs/package.json').exports))"`
prints the live list) — **plus one the map does not have yet**,
`./eslint-restrictions`, for the generic restriction tables.

That addition is the correction to an easy misreading: the generic tables are
**not** reachable through any subpath today. `eslint.restrictions.shared.mjs` is a
package-internal module that the two eslint configs import by relative path, and
nothing in `exports` resolves it —

```sh
node -e "const e=require('./packages/vite-configs/package.json').exports; console.log(Object.values(e).some(v => String(v).includes('restrictions')))"
# false
```

So shipping them **grows** the map rather than preserving it. They need a subpath
of their own because ESLint flat config replaces a rule wholesale: a consumer
that adds its own `no-restricted-syntax` block after the factory's silently drops
every restriction the factory set, and can only avoid that by re-composing the
generic tables into its own value. That is the trap
`eslint.custom-rules.shared.config.mjs` already documents in a comment for
in-repo callers; publication turns it into a trap for people who cannot read that
comment.

**Stays here**, each with the option that replaces it:

1. **The StyleX `@lcabrera/ui/*` alias** in `vite.plugins.shared.config.ts`.
   Becomes a `stylexAliases` option defaulting to none; each app passes its own.
   Today it is unconditional, so a consumer would get an alias to a directory
   three levels above its repo.
2. **The `@lcabrera/ui` / `@lcabrera/server` boundary tables** —
   `UI_PUBLIC_IMPORT_BOUNDARY_PATTERNS`, plus the entries of
   `CLIENT_IMPORT_BOUNDARY_SYNTAX_RESTRICTIONS` whose selector names
   `@lcabrera/ui` (the `entry/createHandleRequest.util` and `@lcabrera/ui/server`
   bans) and the `@lcabrera/server/db` half of its DB restrictions. They move to
   a repo-owned `eslint.restrictions.repo.mjs` at the repo root, and
   `createCustomRulesLintConfig` takes them as tables rather than as the
   `enforceUiPublicImportBoundary` / `enforceServerClientImportBoundary` booleans
   it has now. What ships is the rest: the generic tables listed under
   **Problem**, and the `node:`-builtin selectors of the same restriction list,
   which name no package at all.
3. **The Oxlint workspace roster** — `BROWSER_WORKSPACES`, `NODE_WORKSPACES`,
   `RUNTIME_AGNOSTIC_WORKSPACES` and the `WORKSPACE_RUNTIMES` map they feed.
   `lintSharedConfig` becomes a `createLintConfig({ workspaceRuntimes })`
   factory, and the roster moves to the root `vite.config.ts` — already this
   repo's one lint-config home ([ADR-042](ADR-042-oxlint-config-at-the-root.md)).
   `scripts/verify-lint-plugins.mjs` imports `WORKSPACE_RUNTIMES` from the
   package today and follows the roster to its new home.
4. **The `docker/local/.env` path** baked into `LOAD_LOCAL_ENV` in
   `vite.run.shared.config.ts`. Becomes an `envFiles` argument on
   `createReactRouterRunConfig`, defaulting to the workspace's own `.env` only.

### `packages/plugins` folds in rather than publishing

It exports one Vite plugin (`fixReactRouterAssets`) and `packages/vite-configs`
is its only consumer — `vite.plugins.shared.config.ts` is the single import site
in the repo. A one-export package with one internal consumer is coordination
cost with no separation anyone uses: its own version, changeset, gate run,
API-surface snapshot, `attw` run and manual first publish, bought so that a
consumer can decline a plugin it already declines through the
`withFixReactRouterAssetsPlugin` flag on `createReactRouterPluginsConfig`.

Folding it in also removes a `@repo/*` edge that would otherwise have to become a
published dependency of a published package.

### `@lcabrera/node` ← `packages/node-runtime`, unchanged and unfolded

Two merges look tempting and both are wrong:

- **Not `@lcabrera/server`.** That package depends on `pg`. A consumer that
  wanted a shutdown handler would pull the Postgres driver into its graph —
  exactly the regression
  [ADR-038](ADR-038-public-package-topology-by-runtime.md) was written to stop,
  when `@lcabrera/ui` dragged `pg` in through the then-combined package and
  `packages/ui`'s `check:public-api` gate was added to make that failure loud.
- **Not `@lcabrera/utils`.** That package guarantees pure, side-effect-free
  helpers — its generated tsconfig passes `types: []` so it cannot even name
  `process`, and `vite.lint.shared.config.ts` classifies it runtime-agnostic for
  the same reason. Registering process signal handlers is a side effect by
  definition, and it is the exact category that was split out of `utils` to
  protect the guarantee (AGENTS.md §1). Folding it back in would erode the one
  property that makes `@lcabrera/utils` worth its own package.

So it stays a small package. Small is the right size for a boundary that is
right.

### `@lcabrera/scan-report` — how the scan-report skills are distributed

`linter-checker`, `code-smell-checker` and `fallow-code-checker` split cleanly:
**`SKILL.md` is prompt text, the `scripts/` are code.**

- **The scripts publish** as `@lcabrera/scan-report`: the shared halves
  (`.github/skills/code-smell-shared/scripts/deterministic-scan-shared.mjs`,
  `.github/skills/code-smell-shared/scripts/finding-templates.mjs`,
  `.github/skills/linter-checker/scripts/lint-report-shared.mjs`) and the report
  generators belonging to these three skills —
  `.github/skills/linter-checker/scripts/generate-oxlint-report.mjs`,
  `.github/skills/linter-checker/scripts/generate-eslint-report.mjs` and
  `.github/skills/fallow-code-checker/scripts/generate-fallow-report.mjs`, plus
  the `run-fallow.sh` helper the last one shells out to. Each becomes a `bin`
  entry so a consuming repo runs it by name rather than by path. `SCHEMA_V1.md`
  and `REPORT_JSON_CONTRACT.md` ship in `files`, so a consumer can read the
  contract it is producing.

  `find .github/skills -name 'generate-*-report.mjs'` returns more than that
  list, and the surplus does **not** travel:
  `.github/skills/app-graph/scripts/generate-app-graph-report.mjs` belongs to a
  different skill family with its own output contract, and `app-graph` is not one
  of the three skills this section is about. Selecting by that filename glob
  rather than by skill membership is the mistake to avoid when #677 assembles the
  `files` list.

- **The `SKILL.md` files do not.** An agent discovers a skill by scanning
  `.github/skills/`, so each repo keeps its own — and it should: the scope
  defaults, `allowed-tools` and argument hints are per-repo. `validate-skills.yml`
  keeps checking the local copies.

Published from **this** repo, not from the extracted CodePulse one. That is
forced by the wave ordering in #672: #677 is in wave B, blocked only by this ADR,
while the CodePulse repository does not exist until #678 in wave C. A mechanism
that requires the new repo cannot be implemented by the issue that needs it.

Ingestion is not part of the package. #677 turns `ingestIntoCqms` — which shells
out to a hardcoded `packages/scan-ingestion/src/cli/ingest.cli.ts` with two
hardcoded env-file paths — into a configured command that skips with a clear
message when nothing is configured; #682 publishes the CodePulse ingestion CLI
this repo then configures it to call. That order means the skills never break,
they only stop persisting until #682 lands.

### The published file names keep their `.shared.` infix

#673 flagged this as worth deciding rather than defaulting, on the grounds that
the infix is "noise on the consumer's import line". It is not on the consumer's
import line at all: the consumer-visible surface is the `exports` subpath map
(`./fmt`, `./lint`, `./pack`, `./plugins`, `./run`, `./eslint-custom-rules`,
`./eslint-base-custom-rules`), which already carries no infix, and the file names
sit behind it. Renaming the `vite.*.shared.config.ts` files changes nothing
anyone types, and breaks `git log --follow` on every one of them.

The infix also still disambiguates inside the package, which keeps its own
`eslint.config.mjs` and `vite.config.ts` alongside the shared ones.

### `@repo/vite-configs` dependency classification

Every dependency is a `devDependency` today — correct for a workspace-internal
package resolved only through the monorepo, and wrong for a published one. A
consumer loading `./eslint-custom-rules` needs those plugins _present_, and the
failure will not reproduce in this repo, where pnpm hoists them anyway.

One row per `devDependency` in `packages/vite-configs/package.json` as it stood
on 2026-08-14 — compare against
`node -e "console.log(Object.keys(require('./packages/vite-configs/package.json').devDependencies))"`
before relying on the table. Each verdict comes from the import sites, read with
an exact-specifier grep over the package's `.ts` and `.mjs` sources. "Optional
peer" means `peerDependenciesMeta.optional`
([ADR-047](ADR-047-declare-optional-peer-dependencies.md)) — required only by the
export that uses it.

| Current `devDependency`       | Published as  | Why                                                                                                                                                                                                                        |
| ----------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@babel/preset-typescript`    | optional peer | named as a **string** in the babel config `./plugins` emits; `@babel/core` resolves it from the consumer's root                                                                                                            |
| `@eslint/js`                  | peer          | statically imported by `./eslint-base-custom-rules`, and re-resolved from the consumer by `./eslint-custom-rules`                                                                                                          |
| `@lcabrera/eslint-plugin`     | dependency    | imported by name in both eslint configs; the consumer never names it (registered under the `local-rules` key)                                                                                                              |
| `@lcabrera/utils`             | drop — unused | no import site in the package; `vp run fallow:audit` reports it as an unused devDependency independently                                                                                                                   |
| `@react-router/dev`           | optional peer | `./plugins` calls `reactRouter()`; the version must track the consumer's React Router                                                                                                                                      |
| `@repo/plugins`               | — folds in    | becomes internal source of `@lcabrera/vite-config`; the edge disappears                                                                                                                                                    |
| `@stylexjs/unplugin`          | optional peer | `./plugins` calls `stylex.vite()`; StyleX compilation must be one instance with the consumer's                                                                                                                             |
| `@types/node`                 | dev-only      | needed to typecheck this package's `node:*` imports; no Node type reaches the emitted `.d.ts`                                                                                                                              |
| `babel-plugin-react-compiler` | optional peer | same string resolution as `@babel/preset-typescript`                                                                                                                                                                       |
| `eslint`                      | peer          | the runtime that loads both eslint exports                                                                                                                                                                                 |
| `eslint-config-prettier`      | peer          | statically imported by the base config; re-resolved from the consumer by `./eslint-custom-rules`                                                                                                                           |
| `eslint-plugin-perfectionist` | peer          | same                                                                                                                                                                                                                       |
| `eslint-plugin-security`      | peer          | same                                                                                                                                                                                                                       |
| `eslint-plugin-unicorn`       | peer          | same                                                                                                                                                                                                                       |
| `globals`                     | peer          | same                                                                                                                                                                                                                       |
| `typescript`                  | dev-only      | `tsc --noEmit` here; consumers bring their own                                                                                                                                                                             |
| `typescript-eslint`           | peer          | re-resolved from the consumer by `./eslint-custom-rules`, and supplies the parser the consumer's config uses                                                                                                               |
| `vite`                        | dev-only      | no import site and no `vite/client` type reference; `vite-plus` supplies every Vite type named here — but fallow does not flag it, so #675 settles it by regenerating the lockfile (ADR-047) rather than on the grep alone |
| `vite-plugin-babel`           | optional peer | `./plugins` imports it and hands it the consumer's babel config                                                                                                                                                            |
| `vite-plus`                   | peer          | every config export is typed against `vite-plus`; a Vite+ config package's consumer has it by definition                                                                                                                   |
| `vitest`                      | dev-only      | runs this package's own `vite.run.shared.config.test.ts`                                                                                                                                                                   |

**More are required and declared nowhere at all.**
`createCustomRulesLintConfig` resolves `@stylexjs/eslint-plugin`,
`eslint-plugin-react-dom`, `eslint-plugin-react-hooks`,
`eslint-plugin-react-refresh` and `eslint-plugin-react-x` at call time, and not
one of them appears in `packages/vite-configs/package.json`. It works today only
because `apps/react-router`, `apps/admin_system` and `packages/ui` each declare
them for themselves. They all become peers, on the same reasoning as the peer
rows above.

**The trap that makes this more than a manifest edit.**
`./eslint-custom-rules` does not import its plugins — it resolves them through a
`createRequire` rooted at the caller's own `tsconfigRootDir`, deliberately, so a
long-lived editor ESLint process resolves per app rather than from a single
`process.cwd()`. Under pnpm's isolated layout a peer dependency is linked into
the _dependent's_ directory, not the consumer's root, so declaring these as peers
documents the requirement and makes the failure loud but does **not** by itself
satisfy that resolver: the consuming workspace has to declare them too. `./fmt`,
`./lint`, `./pack`, `./run` and `./eslint-base-custom-rules` have no such
requirement.

### The extracted CodePulse repo publishes under `@codepulse/*`

The scope question is ADR-040's, asked in the new repo: a package that ships
takes the product scope, one that does not stays `@repo/*`. Carrying `@lcabrera/*`
across would say the packages belong to this repo's product line, and carrying
`@repo/*` across would say "internal to this monorepo" about a different
monorepo — the two names would then mean the same thing in two places, which is
the confusion ADR-040 exists to prevent.

`@codepulse/*` is the scope, and #682's ingestion CLI is the first package to
need it — a CLI installable from outside its own repo is precisely what makes the
ingestion contract a versioned interface rather than a relative path.

**Precondition:** the npm registry search for `scope:codepulse` returned zero
packages on 2026-08-14, which shows no package is published there — it does **not**
prove the scope is unclaimed, since an org can exist with nothing public and the
search index lags. #678 must confirm the scope is registrable by the account that
owns `@lcabrera` before depending on the name; if it is not, the fallback is
`@lcabrera/codepulse-*`, which loses the product signal but nothing else.

## Consequences

**Four new public packages inherit the strictest tier** (AGENTS.md §1/§4): no
baselining, no scoping, no inline disables, a gitignored
`eslint-suppressions.json`, and `publish:verify` / `api-surface:verify` /
`attw:verify` on every change, plus a changeset per consumer-facing change and a
manual first publish. `packages/ts-configs`, `packages/vite-configs` and
`packages/plugins` each carry a committed `eslint-suppressions.json` today, so
each implementing issue has to clear its suppressions rather than carry them
over.

**Membership of that tier is not decided by prose.** `vp run suppressions:verify`
derives the public-package list from which workspaces gitignore
`eslint-suppressions.json`, so a package joins the day its manifest and gitignore
change — not the day this ADR merged. AGENTS.md names these four as decided, and
says so.

**The three that ship TypeScript must ship built `dist`, not source.** Node
refuses to strip types for anything under `node_modules`
(`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`), and each of
`@lcabrera/tsconfig`, `@lcabrera/vite-config` and `@lcabrera/node` is _loaded_
rather than only typechecked: the first's writer is run by
`node --experimental-strip-types`, the second's `.ts` configs are imported by a
consumer's `vite.config.ts`, and the third's `exports` points straight at
`src/registerShutdownSignals.util.ts`. So each needs the
`exports`/`publishConfig.exports` swap that ADR-057 describes and
`scripts/verify-publish-surface.mjs` enforces. `@lcabrera/scan-report` is the
exception: it ships `.mjs`, which loads from `node_modules` fine, so it has no
build step and no swap.

**Two of the four repo-data extractions are visible outside the packages.**
Moving the Oxlint roster to the root `vite.config.ts` moves what
`scripts/verify-lint-plugins.mjs` reads, and moving the boundary tables to a root
`eslint.restrictions.repo.mjs` adds an import to every workspace
`eslint.config.mjs` that enforces a boundary. Neither is a behaviour change, and
both are load-bearing: if the roster arrives empty the classification gate has
nothing to check, and if a boundary table arrives empty the eslint pass goes
green on code it should reject. Rule 14 applies to each — confirm with a
deliberate violation, because an unloaded table reports exactly the clean pass
that correct code does.

**The `@lcabrera/vite-config` peer list is long, and that is the honest cost.**
Most of the table above lands in `peerDependencies`, and some of those entries
are not declared anywhere today. A consumer installs the config package and still
has to declare the ESLint plugin set itself for `./eslint-custom-rules` to
resolve. Making that list shorter means changing the per-app resolution strategy,
which exists for a real reason and is out of scope here.

**This repo gains a dependency on its own published packages.** After #674–#676,
every workspace that depends on the toolchain today
(`grep -rln '"@repo/vite-configs"\|"@repo/ts-configs"\|"@repo/node-runtime"' --include=package.json apps packages`
lists them) stops depending on something unpublishable, and this repo starts
consuming the toolchain the way any other repo would — which is the first honest
test of it, the same argument #672 makes about `@lcabrera/ui`.

## Alternatives considered

**Vendor the toolchain into the new repo, publish only if the copies diverge.**
This was #672 §7's original recommendation, and it buys a cheaper extraction at
the cost of the thing being built. Divergence is not self-reporting: two copies
drift silently and the drift is only discovered when someone tries to reconcile
them. It also answers the extraction question while leaving the general one — a
third repo is back to copy-or-do-without. Rejected in #672's own sub-issue
decomposition, which reverses §7 explicitly.

**Start the new repo from a trimmed fork of this one.** Cheapest on day one and
the worst on day one hundred: the fork inherits every convention including the
ones it does not want, and there is no mechanism at all for a fix to travel
between the two. Rejected.

**Publish `@repo/plugins` as `@lcabrera/vite-plugins`.** A separately versioned
one-export package could be adopted by someone who wants the React Router asset
fix and none of the config. Nobody has asked, the plugin is already declinable
through a flag, and the coordination cost is paid every release. Rejected as
speculative generality; folding is reversible, an npm name is not.

**Fold `@repo/node-runtime` into `@lcabrera/server` or `@lcabrera/utils`, or
inline it into `apps/scan-orchestrator`.** The first two are rejected above on
ADR-038 and the purity guarantee. Inlining is rejected because of the consumer
split in the Context table: `apps/scan-orchestrator` leaves with CQMS while
`apps/api-server` and `apps/api-server-fast` stay, so inlining into the one that
leaves means duplicating `registerShutdownSignals` into the ones that do not —
without the boundary ADR-039 asks for when duplication is the right call.

**Ship the scan-report scripts from the CodePulse repo instead.** CodePulse owns
the ingestion contract and consumes the output, so it looks like the natural
owner. Rejected on ordering: #677 is blocked only by this ADR and lands in wave
B, while the CodePulse repo is not scaffolded until #678 in wave C. It would also
make a repo that only wants deterministic lint reports install a code-quality
product to get them, when the scan half already runs standalone via
`--skip-ingest`.

**Rename the shared config files to drop the `.shared.` infix.** Rejected above:
it is invisible to consumers, who see only the `exports` subpaths.

## References

- #673 (this decision), #672 (the CQMS extraction epic), #674, #675, #676, #677,
  #678, #682
- [ADR-038](ADR-038-public-package-topology-by-runtime.md) — public package
  topology by runtime; why `pg` must not reach a client-safe graph
- [ADR-039](ADR-039-duplicate-over-undeclared-edges.md) — duplicate rather than
  share through an edge that only resolves in-repo
- [ADR-040](ADR-040-npm-scope-for-the-public-packages.md) — `@lcabrera/*` vs
  `@repo/*`; the question a scope answers
- [ADR-042](ADR-042-oxlint-config-at-the-root.md) — Oxlint is configured once, at
  the root
- [ADR-046](ADR-046-public-api-surface-snapshot.md) — the API-surface ratchet a
  new public package joins
- [ADR-047](ADR-047-declare-optional-peer-dependencies.md) — optional peers, and
  proving a vestigial dependency by regenerating the lockfile
- [ADR-048](ADR-048-adr-taxonomy-and-one-sequence.md) — why this ADR is in this
  home: the decision stays when CQMS moves
- [ADR-057](ADR-057-publish-the-custom-lint-rules.md) — the precedent; make the
  repo's own conventions optional, then ship
- [ADR-060](ADR-060-source-shipping-package-module-resolution.md) — what a
  source-shipping package must do differently
- [`packages/CLAUDE.md`](../../packages/CLAUDE.md) — the publishing contract each
  new package inherits
