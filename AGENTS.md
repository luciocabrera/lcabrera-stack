# Project Instructions — vite-react-compiler

<!-- Audience: Claude, Gemini, and other non-GitHub agents — for GitHub Copilot see .github/copilot-instructions.md -->

This file provides guidance to AI agents when working with code in this repository. It contains the **universal, always-relevant** standards. Detailed per-file-type conventions live in `.claude/rules/` (see [Path-Specific Rules](#2-path-specific-rules)), and task workflows live in `.github/skills/`.

## 1. Project Overview

This is a **pnpm monorepo** built with the **Vite+** unified toolchain (`vp` CLI).

**The `packages/` are the product. The `apps/` exist to exercise them.** Read
that as the tie-breaker it is: when package cleanliness and app convenience pull
in opposite directions, the package wins. A package must stand on its own —
declared dependencies, a resolvable public surface, no reliance on a consumer's
tsconfig `paths` to make an import work — because it is meant to be consumed from
outside this repo, where none of this monorepo's wiring exists. `packages/ui`,
`packages/api`, `packages/server`, `packages/utils` and
`packages/eslint-local-rules` are held strictest for exactly that reason (§4). This is why the column-filter shapes are **duplicated**
in `@lcabrera/ui` and `@lcabrera/server` rather than shared through an elegant edge that
only resolves in-repo ([ADR-039](docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)).
Facing that call — promote it into a package, or write it twice?
[`docs/agents/cross-app-abstraction.md`](docs/agents/cross-app-abstraction.md)
walks the decision in order and links the ADR that owns each step.

**Two scopes, and the split carries meaning.** The publishable packages are
**`@lcabrera/*`**; the internal ones (`vite-configs`, `ts-configs`, `plugins`,
`agent-runner`, `node-runtime`, `scan-ingestion`) stay **`@repo/*`**. So the
import line tells you which side of the product boundary you are on: `@lcabrera/`
means it ships and has consumers outside this repo, `@repo/` means internal, change
it freely. A new package picks its scope by one question — does it ship? — and a
`@lcabrera/*` one inherits the never-baseline rule (§4) and the invariants below.
Do not "tidy" the two into one ([ADR-040](docs/decisions/ADR-040-npm-scope-for-the-public-packages.md)).
A package in **neither** scope means that question was never asked — that is how
the custom lint rules sat unscoped until they became `@lcabrera/eslint-plugin`
([ADR-057](docs/decisions/ADR-057-publish-the-custom-lint-rules.md)).

**Four of those `@repo/*` names are on their way out, and the answer to "does it
ship?" is now yes for each.**
[ADR-069](docs/decisions/ADR-069-publish-the-shared-toolchain.md) publishes
`packages/ts-configs` as `@lcabrera/tsconfig`, `packages/vite-configs` (folding
in `packages/plugins`) as `@lcabrera/vite-config`, `packages/node-runtime` as
`@lcabrera/node`, and the three scan-report skills' shared scripts as
`@lcabrera/scan-report` — so the list above is what the manifests still say, not
where they are going. #674–#677 do the renames; until one lands, its package is
`@repo/*` and `private: true` in fact. Treat all four as public-in-waiting: what
makes them publishable at all is that this repo's own data — the Oxlint
workspace roster, the `@lcabrera/ui`/`@lcabrera/server` boundary tables, the
`docker/local` env path, the tsconfig entry table — comes out of them and
becomes configuration, so adding a new hardcoded repo fact to one of them now
works against that.

**They are published on npm, and nothing but the version number stands between
a mistake and the registry** — `private` is off and each has a trusted publisher,
so a merged version bump publishes on its own, and **an npm version is permanent**.
The full publishing contract — the `exports`/`publishConfig` split, `files`, peer
dependencies, the API-surface gate, and the two rename traps that silently break a
consumer — lives in [`packages/CLAUDE.md`](packages/CLAUDE.md), which loads
whenever you work under `packages/`. Read it before editing any manifest there.

The apps are the harness. `apps/react-router` is a **React 19 + TypeScript +
StyleX + React Router 7** SSR application that puts the packages under load —
a feature-rich data Table with store-based state management, virtualization,
infinite scroll, and granular subscriptions via `useSyncExternalStore`. It is
also where cross-package integration is verified, since it is the only thing that
legitimately depends on several packages at once. Never put a guarantee a
_package_ relies on into an app.

### Monorepo Layout

`ls apps/ packages/` is the layout; `pnpm-workspace.yaml` is the authority. What
the listing cannot tell you is below.

`packages/ui`,
`packages/api`, `packages/server`, `packages/utils` and
`packages/eslint-local-rules` are public packages and are held strictest: never
baseline, scope, or inline-disable a finding in any of them. The authority on
that list is not this sentence — it is which workspaces gitignore
`eslint-suppressions.json`, which `vp run suppressions:verify` reads at runtime,
so a new public package is covered the day it is added; keep the prose in step.

`packages/ts-configs`, `packages/vite-configs` (absorbing `packages/plugins`)
and `packages/node-runtime` join that list as `@lcabrera/tsconfig`,
`@lcabrera/vite-config` and `@lcabrera/node`, and a fourth is built from the
scan-report skills' shared scripts as `@lcabrera/scan-report`
([ADR-069](docs/decisions/ADR-069-publish-the-shared-toolchain.md)). None of
them is in the tier yet, and the rule above says why: `packages/ts-configs`,
`packages/vite-configs` and `packages/plugins` each still commit an
`eslint-suppressions.json`. Each is admitted by its own implementing issue
(#674–#677) clearing those suppressions and gitignoring the file — not by being
named here.

`api` and `server` split on **runtime**, and the split is load-bearing, not
cosmetic — the two names say which runtime each one is for, and the tsconfigs
enforce it in both directions. `@lcabrera/api` is browser-safe: its tsconfig omits
`node` types, so a `process`/`fs` reach-in fails typecheck there. `@lcabrera/server`
is Node-only (`pg`, `node:crypto`) and gets no DOM lib, so a `window`/`document`
reach-in fails there. They were one package until the cost showed up: `@lcabrera/ui`
depended on the combined package for two fetch helpers and so pulled the Postgres
driver into every consumer's dependency graph. `packages/ui`'s `check:public-api`
now enforces the invariant — **a client-safe package may only depend on workspace
packages that are themselves client-safe** — so that regression fails the gate
instead of passing silently. The full topology and what each tsconfig denies is
[ADR-038](docs/decisions/ADR-038-public-package-topology-by-runtime.md),
which supersedes ADR-008.

`utils` and `node-runtime` split on purity, and the split is deliberate:
`@lcabrera/utils` guarantees pure, side-effect-free helpers, so anything that must
touch the process (signal handlers, exit paths) belongs in `@repo/node-runtime`
instead of eroding that guarantee. That is also why publishing does not merge the
two — nor fold `node-runtime` into `@lcabrera/server`, which would drag `pg` into
a consumer that only wanted a shutdown handler (ADR-069, on ADR-038's reasoning).

All source paths below (e.g. `src/components/`) are relative to `apps/react-router/` unless otherwise noted.

### Source Structure (apps/react-router/src/)

**This app is deliberately thin.** Components, hooks, contexts, design tokens,
shared utils and the Table live in `@lcabrera/ui`; pure helpers in `@lcabrera/utils`.
The app no longer has `components/`, `hooks/`, `contexts/`, `design-system/`,
`types/` or a populated `utils/` — so when a rule below says "the component
directory", that is `packages/ui/src/components/`. Reach for the package
inventories first:
[`packages/ui/src/INVENTORY.md`](packages/ui/src/INVENTORY.md),
[`packages/ui/src/PATTERNS.md`](packages/ui/src/PATTERNS.md).

---

## 2. Path-Specific Rules

Detailed conventions are split into rule files under `.claude/rules/`, each scoped by glob patterns in its `paths:` frontmatter. **Claude Code loads them automatically when editing matching files. Other agents (Copilot, Gemini, etc.): read the matching rule file below before editing files it covers — nothing there is optional.**

| Rule file                           | Applies to                                                      | Contents                                                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/rules/typescript.md`       | `**/*.ts`, `**/*.tsx`                                           | Strict TS rules, `type` not `interface`, readonly, Args/Props/Result naming, file-name suffixes, FP/immutability, import alias                          |
| `.claude/rules/react-components.md` | `**/*.tsx`, `**/*.jsx`, `**/*.stylex.ts`                        | Component bundle structure, declaration/props naming, barrel files, React 19 mandatory rules, StyleX-only styling                                       |
| `.claude/rules/testing.md`          | `**/*.test.*`, `**/*.spec.*`                                    | Vitest/Testing Library conventions, `vp run test` usage, coverage target                                                                                |
| `.claude/rules/routes-data.md`      | `**/routes/**`, `**/services/**`, `**/*.api.ts`, config/entries | Loader/action data flow, zero `useEffect` fetching, store-pattern rule, error boundaries, Zod validation                                                |
| `.claude/rules/scripts.md`          | `**/*.mjs`, `**/*.cjs`, `**/scripts/**/*.js`                    | Build/tooling script standards — JSDoc "why" header, small pure functions, effects at edges, `node:` builtins, 350-line size ceiling (`scripts:verify`) |

## 3. Quick Skill Index

Skills are on-demand task workflows in `.github/skills/`. Each one's own
`description:` frontmatter says what it covers, and agents that support skills
already have that listing — so it is not repeated here. Use them as the first
stop for implementation patterns.

Selection guideline:

- **Working in complex UI state?** Start with `store-pattern`.
- **Finishing any code change?** Run `quality-gate-workflow`.
- **Committing or opening a PR?** Use `commit-and-pr`.
- **Routing/data mutations?** Use `react-router-framework-mode`.
- **React component implementation?** Use `react-19`.
- **Understanding unfamiliar code before changing it?** Use `codebase-explorer`.
- **Auditing what has rotted repo-wide?** Use `health-swarm` — six read-mostly
  scouts in parallel (duplication, dead code, perf, deps, doc drift, lint
  coherence), each held to a probe that could have disproved its own finding.
  Prefer a subset (`/health-swarm perf deps`) unless a full sweep is warranted.
- **Configuring or debugging a linter (Oxlint/eslint/Biome/Sonar)?** Use `lint-toolchain`.
- **Cutting a release, or touching the changelog/label automation?** Use `releasing`.
- **Implementing a backlog issue that has real acceptance criteria?** Use
  `refactor-verified` — a builder subagent implements it, and a **separate**
  verifier subagent certifies it from the diff and the criteria alone, never the
  builder's reasoning. The standard it enforces is
  [`docs/agents/refactor-verified-contract.md`](docs/agents/refactor-verified-contract.md).
- **Driving a whole epic to merged?** Use `epic` (`/epic <n>`) — the epic-scale
  form of the above, not a replacement for it. It maps the dependency graph,
  dispatches the same builder per issue in waves of at most three, runs the same
  blind verifier per PR alongside Copilot's review, and holds the merge bar. Its
  contract is [`docs/agents/epic-orchestration.md`](docs/agents/epic-orchestration.md),
  which is deliberately epic-agnostic: the live state of any one epic belongs on
  that epic's issue, never in the contract.

---

## 4. Toolchain — Vite+ (`vp`)

> **[COMMANDS.md](COMMANDS.md) is the canonical command reference** — every root
> script, every per-workspace task, what CI runs, and how `vp run <task>`
> resolves. This section keeps only the daily commands and the **policy** behind
> them; it deliberately does not re-list everything, because the duplicate lists
> are what drifted (they claimed 15 workspaces when there were 16). Add a
> command → add it to COMMANDS.md in the same commit.
>
> **`vp run commands:verify` enforces that** (CI step in `check-safe.yml`): a new
> root script that is undocumented, a documented command that no longer resolves,
> a wrong per-workspace claim, a broken link, or a stale workspace count all fail
> the build. So do not re-list commands here — a copy in this file is a copy the
> checker does not police, which is exactly how the last set rotted.

**The `.mjs`/`.cjs` scripts running these checks are themselves governed** — see
[`.claude/rules/scripts.md`](.claude/rules/scripts.md). This was a real blind spot:
the path-specific rules target TS/TSX, the eslint fan-out is per-workspace so it
never reaches root `scripts/`, and fallow's `maxUnitSize` is per-function — so
tooling scripts grew to 400–650 lines ungoverned. `vp run scripts:verify` (CI step
in `check-safe.yml`) caps code lines per file; inherited offenders are
grandfathered in `scripts/script-size-baseline.json` and may not grow (rebaseline
with `--write`, reviewed via the JSON diff). Correctness still comes from Oxlint +
Biome (repo-wide) and fallow (per-function complexity/dead-code).

**The Node version is enforced, not suggested.** `.node-version` holds the exact
version to be on; root `engines.node` holds the band an install may proceed in;
`engineStrict: true` in `pnpm-workspace.yaml` makes pnpm **refuse** to install
outside it, naming the version it got. The band is deliberately wider than the
pin, so a Node patch release does not hard-fail every install before someone
updates the file. Do not make them identical, and do not relax `engineStrict` to
get past a failure — install the Node version the repo asks for.

This is enforcement the repo previously got by accident. Vite+'s default managed
mode resolves the `node` shim **from** `engines.node`, so it could not hand you a
version outside the range; on a machine where Node comes from anywhere else
(nvm, fnm, a distro package) the floor silently disappeared, and both `vp
install` and `vp run` proceeded on an unsupported runtime without a warning.
`engineStrict` gates **installs** — a bare `node script.js` is still whatever is
on PATH.

**Never use pnpm/npm/yarn directly for anything `vp` wraps.** Every daily operation
goes through `vp` and each one is spelled out in
[COMMANDS.md §2](COMMANDS.md#2-daily-commands) — `install`, `dev`, `add` and
`remove` are the bare `vp` equivalents you would guess. The four worth stating here
are the ones you would guess **wrong**:

| Task                 | Command                                                                                |
| -------------------- | -------------------------------------------------------------------------------------- |
| Build for production | `vp run build` (runs `react-router build` and emits `build/server/index.js`)           |
| Type check           | `vp run typecheck` (real tsc) — `vp check` runs tsgolint, which is a different pass    |
| Run tests            | `vp run test` (never `vp test` — see the `quality-gate-workflow` skill)                |
| Full validation      | The canonical quality gate — see [Post-Change Quality Gate](#post-change-quality-gate) |

**The exception is a command `vp` does not wrap** — then reaching for pnpm (or
`npx`) directly is correct, not a workaround, because there is nothing to route
through `vp`. Two such cases exist today: `pnpm clean --lockfile` (there is no
`vp clean`) and catalog updating via `taze`; both live in
`scripts/deps-refresh.sh` (`vp run deps:refresh`). The test is mechanical — if
`vp` exposes the command, use `vp`; if it genuinely does not, pnpm-direct is
fine. This is deliberately narrow: it does **not** license `pnpm install` /
`pnpm add` / `pnpm dlx` where `vp install` / `vp add` / `vp dlx` exist. The
release commands are a related case decided in
[ADR-043](docs/decisions/ADR-043-release-tooling-changesets-over-pnpm-native.md).

### Monorepo-Wide Commands (run from repo root)

Root scripts are **orchestration only** — anything project-specific lives in that project's own package.json. The `<task>:all` family fans out recursively in workspace dependency order.

**Full list: [COMMANDS.md §4](COMMANDS.md#4-root-orchestration-scripts).** The
policy that governs them:

There is deliberately **no `start:all`/`dev:all`**: `car-sales-api` and `car-sales-api-fast` are performance-comparison alternatives serving the same domain and must never run at the same time — always pick one combo.

**`vp check` type-checks, but it is not `tsc` — both run, and `typecheck:all` is the authority.** `vp check`'s type pass is **tsgolint** (Oxlint's type-aware path, enabled by `lint.options.typeCheck` in the root `vite.config.ts`), and it does resolve each workspace's own strict `tsconfig.app.json` — `strict`, `noUncheckedIndexedAccess` and `noUnusedLocals` all fire under it. What it does **not** do is run the per-workspace `typecheck` scripts, and those carry work no linter replicates: `packages/ui` gates its public API against server-only `node:*` imports (`check:public-api`), and both React Router apps regenerate route types first. Every one of the 17 workspaces now has a `typecheck` script, CI runs `vp run typecheck:all` as its own step in `check-safe.yml`, and `check:safe` chains it. Keep the two passes in sync: a new workspace gets a `typecheck` script **and** a tsconfig, or it silently falls back to the near-empty root `tsconfig.json` and is checked far more loosely than every other workspace (this is exactly how `utils`/`plugins`/`vite-configs` went un-strict for so long — `noUncheckedIndexedAccess` never fired there).

**tsconfigs are generated — never hand-edit them.** `packages/ts-configs/generate.ts` + `tsconfig.shared.ts` are the source of truth for every `tsconfig.app.json`/`tsconfig.node.json`; run `vp run --filter @repo/ts-configs generate` after changing either. A hand-edit survives exactly until the next unrelated regeneration silently reverts it — the `@lcabrera/ui` bare-specifier alias in both apps was lost this way and had to be folded back into the generator. If a config needs something bespoke, add it to the generator entry, not to the JSON.

**Four analysers run, and `vp check` is not one of them.** Oxlint (`vp lint`,
configured once in the root `vite.config.ts`), the per-workspace eslint
custom-rules pass (`vp run lint:eslint:check`), Biome (`vp run lint:biome:check`,
root-only), and React Doctor (`vp run react-doctor:verify`). `vp check` covers
only fmt + Oxlint + the tsgolint type pass, so it would let every eslint-only,
Biome-only and React Doctor finding through — run the full gate (§7).

Configuring or debugging any of them — plugin/category semantics, the
`biome.jsonc` parse trap, the public-package suppressions register, SonarCloud
reporting — is the **`lint-toolchain` skill**. One rule from it belongs here
because it governs every engine: **a rule that is not loaded reports exactly the
same clean pass as code that is correct**, so confirm any lint change with a
deliberate violation (Rule 14). Handling a _finding_ is Non-Negotiable Rule 11 —
verify, then fix; never suppress. The public packages (§1) take no
suppressions at all, enforced by `vp run suppressions:verify`.

Known constraint: `scan-orchestrator`'s queue integration test shares the local CQMS Postgres queue — while `vp run dev:cqms` is running, the live orchestrator races the test for queued scans and `vp run test:all` can flake on `runQueuedScan.test.ts` (duplicate `reports_scan_id_key`). Stop the CQMS dev session before a full test run, or treat that single failure as environmental.

**`test:all` vs `test:ci`.** `test:all` runs every workspace and needs a database. CI has no Postgres, so its unit-tests job runs `vp run test:ci`, which is every DB-free suite in the repo: each workspace's `test`, except that `@repo/scan-ingestion` and `@repo/scan-orchestrator` contribute their DB-free `test:unit` subsets (their full `test` tasks stay real-Postgres, so `test:all` still covers everything), and `vite-react-compiler` runs last via its own `test:ci` so the coverage summary the PR comment reads is the fresh one. Run `vp run test:ci` before pushing if you don't have a DB up.

**A workspace with real-Postgres tests must split them**, the way `scan-ingestion` and `scan-orchestrator` do: keep the full suite as `test`, and expose a `test:unit` (plus `test:coverage`) that `--exclude`s the DB-bound files. Without the split the whole workspace has to be dropped from `test:ci`, which silently takes its pure tests with it.

### Fallow Static Analysis (run from repo root)

Fallow is configured once at the repo root (`.fallowrc.json`) and auto-detects every pnpm workspace — never add per-app fallow configs or dependencies. Scope any command's output with `-w`, e.g. `vp run fallow:dead-code -w 'apps/react-router'`.

`reports/fallow/` is the **single canonical location** for every fallow artifact; only `reports/fallow/baselines/` is tracked. The split is a rule, not a habit: a gate compares against it → tracked; it reports what a tool found → produced on demand ([ADR-049](docs/decisions/ADR-049-findings-reports-are-produced-on-demand.md)). **So there is no snapshot to read — run the command and read what it writes.**

Before a PR, run `vp run fallow:audit --base main`. CI runs `fallow audit --gate new-only` on every PR (`check-safe.yml`) — it fails only on newly-introduced dead code, complexity, or duplication.

**Always feed the audit real coverage** (`--coverage reports/fallow/coverage/coverage-final.json`, from `vp run coverage:merge`). Without it fallow _estimates_ coverage from whether a colocated test file exists, and at an estimated 0% every function with cyclomatic ≥ 5 breaches the CRAP threshold — an unfed audit reports trivially simple code as `critical`. Read a finding's **`exceeded`** field, not `severity`.

**`@vitest/coverage-v8` in the root manifest looks unused and is load-bearing** — it is an optional peer of vitest, which pnpm resolves only while some manifest declares it. Removing it takes every `--coverage` run down ([ADR-047](docs/decisions/ADR-047-declare-optional-peer-dependencies.md)).

Entry policy, the full output table, the glob-crosses-`/` trap and the coverage-lane details are in the **`fallow-code-checker` skill** ([CONFIGURATION.md](.github/skills/fallow-code-checker/CONFIGURATION.md)).

### Local Database Workflow (run from repo root)

Commands: [COMMANDS.md §4 → Database](COMMANDS.md#database). `vp run db:up` starts
local Postgres; seeding goes through `vp run --filter car-sales-api seed`, because
`seed`/`db:seed` are **api-server scripts, not root scripts**.

The API server (`apps/api-server/`) reads env from `docker/local/.env`. The frontend proxies `/api` to `http://localhost:3001`.

**Critical:** Import Vite config from `vite-plus`, not `vite`, for tooling integration. Example: `import { defineConfig } from 'vite-plus'`. For tests, import test utilities from `vite-plus/test`, not `vitest` directly (e.g. `import { expect, test, vi } from 'vite-plus/test'`) — it re-exports the vite-plus-bundled Vitest, so the test runtime always matches the toolchain and there is no self-managed `vitest` to drift. This convention was re-evaluated and changed once vite-plus became the runner ([ADR-045](docs/decisions/ADR-045-vite-plus-test-imports.md)); the earlier `vitest`-direct rule predated it.

### Agent Checklist

- Run `vp install` after pulling changes and before starting work.
- **Before non-trivial work, claim it in [`docs/coordination/`](docs/coordination/README.md)** — run `vp run coordination:verify` to check for an area overlap first, then copy `tasks/_TEMPLATE.md`. Multiple agents and humans work this repo in parallel; the register is the only signal of who owns what. (Non-Negotiable Rule 12.)
- **Always verify zero linting errors and zero TypeScript errors before considering any task complete.**
- Run the full quality gate (see below) to validate all changes before finishing.

---

## 5. Non-Negotiable Rules (always apply)

The headline rules every agent must know regardless of which files are open. Full detail and examples live in the path-specific rules and skills referenced.

1. **`type`, never `interface`; all properties `readonly`; never `any`; never `React.FC`.** (`.claude/rules/typescript.md`)
2. **StyleX only** — no inline styles, CSS modules, styled-components, or Tailwind. (`.claude/rules/react-components.md`)
3. **Always `use()`, never `useContext()`.** (`.claude/rules/react-components.md`, `react-19` skill)
4. **Zero `useEffect` for data fetching** — loaders/actions only. (`.claude/rules/routes-data.md`)
5. **Store-pattern is the only allowed shared-state approach** — no Redux, Zustand, or ad-hoc Context+useState trees. The Table component is the canonical implementation. Invoke the `store-pattern` skill before touching any store, context, selector, or action.
6. **Every function is pure by default; never mutate anything you did not create in that function** — arguments, props, captured state, store state. Side effects only in designated homes (action hooks, event handlers, providers/loaders, `*.service.ts`/`*.api.ts`). Pick an array operation by **intent**, using the table in `.claude/rules/typescript.md` — `.map()`/`.filter()`/`.flatMap()`/`.reduce()` each have a job, `.filter().map()` is the default for select-and-transform, a locally-allocated `reduce` accumulator may be mutated, and `for...of` is allowed for early exit, multi-output traversals, `Map`/`Set` building and effects. Do **not** "optimize" a chain into `flatMap(x => cond ? [y] : [])` — it is measurably slower than the chain it replaces ([ADR-054](docs/decisions/ADR-054-array-operation-hierarchy.md)). (`.claude/rules/typescript.md`)
7. **React Compiler handles memoization** — favor correct code over manual optimization (ADR-004). Table performance comes from granular selector subscriptions, row virtualization, and split contexts.
8. **Use `@/` alias for `src/`** — relative imports only within the same directory.
9. **No explicit return types on functions/hooks/components — let TypeScript infer** — annotate only when inference genuinely fails (recursion, overloads, complex conditional types) or must be widened. (`.claude/rules/typescript.md`)
10. **Never use workaround-only fixes** — always address and solve the underlying issue. If there is any doubt about intent, trade-offs, or risk, ask the user before applying a workaround or partial fix.
11. **Never ignore, suppress, or omit a lint finding — verify, then fix.** Oxlint/eslint violations (including stylistic `unicorn/*` rules like `prefer-simple-condition-first` / `no-nested-ternary`) are real until you have read the flagged code and confirmed otherwise. Do **not** dismiss one as a false positive without checking, and do **not** silence a new one — no inline `// eslint-disable`/`oxlint-disable`, no rule-off in config, no hand-added `eslint-suppressions.json` entry. Fix the code (reorder operands, restructure logic, wire up/delete the export). If it is a genuine false positive, explain why rather than disabling. The public packages (§1) are held strictest — each one's `eslint-suppressions.json` is gitignored, so none is ever committed and none of them baselines (§4).
12. **Claim shared work before you touch it.** Multiple agents and humans work this repo in parallel. Before non-trivial work, register it in [`docs/coordination/`](docs/coordination/README.md): check for an area overlap, then create a task file (`tasks/_TEMPLATE.md`) with the `area` globs you own, branch, and keep `status`/`updated` current until it merges. Never edit files inside another active task's `area` without coordinating. The register — not `~/.claude/plans/` scratch, which is invisible to everyone else — is the shared record. `vp run coordination:verify` (CI) keeps it honest. (See "Multi-Agent Coordination" in §7.)
13. **Commits and PRs follow the enforced format.** Every commit message is a Conventional Commit (`type(scope): subject`) and every PR has a conforming title plus the required `## What` / `## Verification` sections — checked by the `commit-msg` git hook locally and the `pr-standards.yml` gate in CI. The one spec is `scripts/lib/commit-convention.mjs`; don't restate its type list elsewhere, and (Rule 11) fix a failing message/description rather than weakening the check. (See "Commit & PR Standards" in §7 and the `commit-and-pr` skill.)
14. **A claim needs evidence that could have disproved it, and steps someone else can re-run.** Before writing a finding into a doc, comment, issue or PR, ask **what else would produce the same observation** — if anything would, the probe is not evidence, so change the probe. Then state the **preconditions** the steps depend on (config state, branch, whether a fix has landed); if the same change alters those preconditions, say so explicitly, or the steps stop reproducing the moment they merge. A written claim is load-bearing: someone will act on it without re-deriving it. (See "Verifying a claim" in §7.)

## 6. Security

- Protect routes with authentication guards.
- Never commit secrets — use validated environment variables (Zod schema).
- Never commit sensitive data in logs or error messages.
- Never commit .env files or credentials.

**The dependency tree is gated too.** `vp run deps:audit` fails on a known
advisory at `moderate` or above, in CI and daily on a schedule. Fix the
dependency — the advisory that prompted this gate had a patched version already
in range of everything that declared it, and sat there anyway because nobody was
looking (#516). Where a bump genuinely is blocked, an allowance goes in
`docs/agents/dependency-advisories.json` with a reason and an **expiry date**;
there is deliberately no permanent form, and an allowance matching nothing in
the tree fails the gate too. `minimumReleaseAgeExclude` in
`pnpm-workspace.yaml` rotted exactly that way. The full protocol is
[`docs/agents/dependency-advisories.md`](docs/agents/dependency-advisories.md).

The property that makes it worth trusting: **it refuses a report that walked no
dependencies.** An unreachable registry produces the same empty advisory list as
a healthy tree, and a supply-chain check that goes green when it could not run
is worse than none, because it is believed. Same principle as Rule 14 — a clean
pass is only evidence if something else would have produced a different one.

---

## 7. Documentation & Workflow

- Each feature directory should have a README.
- Architecture docs live in `apps/react-router/docs/` and component-level `ARCHITECTURE.md` files.

### Verifying a claim

Non-Negotiable Rule 14, with the two ways it has actually gone wrong here.

**Read the tool's own documentation before reverse-engineering it.** Vite+'s
docs are local at `node_modules/vite-plus/docs` (and online at viteplus.dev) —
likewise for every other dependency. The whole `#318` detour, three wrong or
half-right conclusions and a long series of probes, was spent rediscovering
behaviour stated plainly in `guide/monorepo.md`: lint config belongs at the root,
per-package `vite.config.ts` is for Vite/Vitest/framework config. Experiments are
for what the docs do **not** answer. Reach for them second, not first.

**Pick a probe that discriminates.** A green run is not evidence on its own — a
rule that is not loaded reports exactly the same clean pass as code that is
correct. Worked failure: concluding that per-workspace Oxlint configs were
ignored, from a probe using `no-debugger`. That is a `correctness` rule, and a
category severity outranks an individual rule entry, so "the config is ignored"
and "the category masked my rule" produce identical output. The probe could not
tell the two apart, so it proved nothing. A rule _outside_ the category showed
the config applies fine.

**Write repro steps with their preconditions.** Worked failure: an issue whose
steps depended on the root lint config having no `plugins` entry — while the same
PR added one. Anyone following the steps afterwards got the opposite result and
reasonably concluded the issue was false. State the tree/config state the steps
assume, and if your change alters it, say so in the steps.

Two habits that follow: **re-run a repro after your own fix lands** to see what a
reader will actually get, and when someone reports that a claim does not
reproduce, **look for the confound before defending or retracting** — both of
those are conclusions, and each needs its own discriminating evidence.

**Comment only what the code cannot say, and keep it short.** There is no
"document every export" rule here — that one existed, produced volume rather than
clarity, and was removed. A name and a signature already say what a function is;
a comment earns its place by carrying what they cannot — a non-obvious
constraint, a trap, a decision whose alternative looks equally reasonable. If the
code can be made clearer instead, do that and write no comment.

**Never put a changing number in a comment or a doc.** Counts, file totals,
finding tallies and measurements are true on the day they are written and wrong
soon after, and nothing checks them — the same silent rot that made
`commands:verify`, `docs:verify` and `scripts:verify` necessary in the first
place. Name the command that produces the number instead (`vp run
suppressions:list`, `vp lint . --format=json`). A count is only allowed where a
gate asserts it, such as `count` in the suppressions register.

The durable place for measurements, investigation narrative and "why we chose
this" is the **PR or the issue** — dated, immutable, and not something a later
reader mistakes for current fact. Keep the file comment to what someone editing
that line needs in order not to break it.

### Multi-Agent Coordination

This repo is worked by multiple agents (Claude, Copilot, Gemini) and humans in
parallel, so **who is working on what** must be visible in git — not left in
per-agent scratch (`~/.claude/plans/`) or auto-memory, which no one else can see.
[`docs/coordination/`](docs/coordination/README.md) is that shared register.

This register is **in-flight** work only (who is touching what, right now). The
**durable backlog** — what should happen next, epics, milestones — lives in
**GitHub Issues / sub-issues / Milestones / Projects**; the boundary is
[ADR-036](docs/decisions/ADR-036-github-planning-layer.md) and the runbook is
[`docs/tooling/github-planning.md`](docs/tooling/github-planning.md). A task that
picks up a backlog item links it with the **required** `issue:` field —
`coordination:verify` fails a live task without a real issue reference, and
`vp run coordination:claim` creates/links the issue (and self-assigns it) for you.
The register is never moved to Issues — a task file is readable offline on any
branch and gated by `coordination:verify`; GitHub Issues are not.

**Before non-trivial work** (anything beyond a one-file fix you commit immediately):

1. **Check for collisions** — run `vp run coordination:verify`; it warns when your intended `area` overlaps an active task. Resolve overlaps (coordinate, or narrow scope) before starting. (`vp run coordination:board` writes a local, gitignored `BOARD.md` table view — never committed, [ADR-037](docs/decisions/ADR-037-coordination-board-is-a-local-view.md).)
2. **Claim it** — the one-step path is `vp run coordination:claim -- <id> "<title>" (--issue <n> | --new-issue) [--area <glob> ...]`, which links/creates the backlog issue, self-assigns it, scaffolds the task, branches, and opens a draft PR. (By hand: copy [`tasks/_TEMPLATE.md`](docs/coordination/tasks/_TEMPLATE.md) to `tasks/<id>.md` and fill in the frontmatter — especially the `area` globs (the soft lock) and the **required** `issue:`.) That file **is** the claim — there is no board to regenerate or commit, so concurrent claims never collide (each is a distinct file).
3. **Pick a branch strategy** — an independent branch (default), or a **shared
   branch** when several agents need each other's WIP (declare it with a
   `branches/<slug>.md` descriptor + an integrator; overlap between tasks on the
   same shared branch is then treated as collaboration, not a collision). Open a
   **draft PR early** (the human-visible progress surface).
4. **Keep `status`/`updated` current**; move through `active → review`. (Status also
   lives in the linked Issue + the Planning board — the GitHub-visible source. If the
   **self-assign the `issue:` when you start** — `gh issue edit <n> --add-assignee @me`
   (or just use `coordination:claim`, which does it at claim time) — which moves its
   board card to In Progress at the START, not when the branch is later pushed; the
   rest of the Status column is automated,
   see [github-planning.md](docs/tooling/github-planning.md#status-automation).)
5. **Close it** — delete the task file when the work merges.

The check runs in CI (`check-safe.yml`). It fails on register _integrity_ (a
malformed task/branch file); overlap/shared-branch/staleness/
missing-branch are non-blocking warnings. Full protocol and schema — including
[independent vs shared branches](docs/coordination/README.md#independent-vs-shared-branches) —
are in the coordination README. Historical scratch plans are catalogued in
[`PLAN_TRIAGE.md`](docs/coordination/PLAN_TRIAGE.md).

### Architecture-First Workflow

Before making **any** code change, read every `ARCHITECTURE.md` that covers the files you are about to touch. These files document intent, data flow, and constraints that are not always visible from the code alone.

**Where to look:**

- The component/hook/util directory being modified (e.g. `packages/ui/src/components/Table/ARCHITECTURE.md`)
- Parent directories if the change crosses boundaries (e.g. `packages/ui/src/hooks/ARCHITECTURE.md`)
- `packages/ui/src/PATTERNS.md` — always read this before creating or modifying any component; it defines naming conventions, StyleX composition order, the drawer-section pattern, filter contract, context+store pattern, and props-forwarding rules
- **The ADRs covering the area** — each home has a generated index, so start there rather than with a filename: [`docs/decisions/`](docs/decisions/README.md) (repo, packages, toolchain), [`docs/cqms/decisions/`](docs/cqms/decisions/README.md) (CQMS/CodePulse), [`apps/react-router/docs/decisions/`](apps/react-router/docs/decisions/README.md) (showcase app). In the app home: Modal → ADR-001, Tooltip → ADR-002, store → ADR-003, memoization/React Compiler → ADR-004, styling → ADR-005, infinite-scroll prefetch → ADR-006, barrel-export boundaries → ADR-007, primary-key sort tiebreaker / columns-derived id → ADR-008, filter-options fetch descriptors → ADR-009, cookie persistence via `/_action/persist-cookie` → ADR-010, grid interaction architecture (capability/command/surface) → ADR-011, column width → ADR-012

If no `ARCHITECTURE.md` exists yet for the area you are changing, create one **before** implementing.

### Reuse Before You Build

Before creating any new component, hook, utility, constant, or type, **consult `src/INVENTORY.md`** first.

1. If an artifact already exists that covers the need — **use it**.
2. If an artifact almost covers the need but is too specific — **enhance it to be more generic** rather than creating a new one. Update its `ARCHITECTURE.md` row and `INVENTORY.md` description after.
3. Only create something new when nothing in the inventory is a reasonable fit.

When in doubt: a codebase with 18 components and 25 utilities that each do one thing well is better than 40 components and 50 utilities with overlapping concerns.

### Commit & PR Standards

Commit messages and PR descriptions in this repo are **enforced**, not just
conventional — the same way `commands:verify` keeps COMMANDS.md honest. The one
spec is [`scripts/lib/commit-convention.mjs`](scripts/lib/commit-convention.mjs);
the **`commit-and-pr` skill** is the how-to and carries the full detail.

The shapes you must get right, checked by the `commit-msg`/`pre-push` hooks locally
and [`pr-standards.yml`](.github/workflows/pr-standards.yml) in CI:

- **Commit** — `type(scope): subject`, a Conventional Commit.
- **Branch** — `<type>/<issue-number>-<kebab-description>`, same `type` vocabulary
  (`main` and `release-*` exempt).
- **PR** — conforming title, plus every section of
  [`.github/pull_request_template.md`](.github/pull_request_template.md). Write
  "None" rather than deleting a heading, and keep the headings' plain spelling —
  numbering or emoji fails `pr:verify`.
- **Issue** — every section of
  [`.github/ISSUE_TEMPLATE/standard_issue.md`](.github/ISSUE_TEMPLATE/standard_issue.md).

**Do not restate the type list in prose** (here, the skill, the PR template) — link
to the spec so they cannot drift. If the standard itself must change, change
`commit-convention.mjs`; the hook, CI, template, and docs all follow from it.
(Non-Negotiable Rule 13.)

### Releasing, Changelog & Labels

The `@lcabrera/*` packages are versioned with **Changesets**, independently. A
change that affects consumers **carries a changeset in the same PR** — that is the
part you must not forget; `vp run release:version` consumes them.

Two invariants worth knowing before you touch a manifest: **`private: true` is the
only thing keeping a workspace out of the registry** (the public ones no
longer carry it, so nothing but the version number decides whether a merge
publishes — every workspace not meant to publish MUST have the flag), and
**`CHANGELOG.md` is generated** (`vp run changelog:generate`) — never hand-edit it.

The release mechanics (why the version PR is opened by a human, why each package's
first publish is manual, the `changesets/action` skip condition), the changelog's
history and the PR label taxonomy are in the **`releasing` skill**.

### Post-Change Quality Gate

**Invoke the `quality-gate-workflow` skill after every code change.** Agents that
cannot invoke a skill (Copilot, Gemini — this file is symlinked for them) read
[`.github/skills/quality-gate-workflow/SKILL.md`](.github/skills/quality-gate-workflow/SKILL.md)
directly. It owns the canonical stage order, why each stage is not covered by
another, and the Documentation Update Rule that follows a green gate.

Do not restate the sequence here — not the stages, and not how many there are. A
copy in this file is a copy nothing polices, and the direction that failure ran is
worth stating exactly: `vp run react-doctor:verify` was added to **this** file when
[ADR-055](docs/decisions/ADR-055-react-doctor-as-a-gate.md) made it a blocking gate
(#457) and was never added to the skill, so for months the skill this file calls
canonical was the copy missing a stage (#670). The lesson is not that one file rots
and the other stays current; it is that two copies drift and only the one nothing
points at gets noticed late.

Two root-level entry points worth knowing without opening the skill: `vp run
check:safe` chains the whole gate the way CI does, and `vp run typecheck:all`
covers every workspace in dependency order.

### Exploration Scratchpads

For multi-step exploration or investigation tasks, use the **`codebase-explorer` skill** — it owns the scratchpad (`findings.md`) and crash-recovery (`manifest.json`) procedure. Scratch files belong under `.tmp/exploration/` (gitignored), never at the repo root.

<!-- This file deliberately carries NO Vite+ managed block. Vite+ rewrites that
     region whenever it syncs agent instructions, which `vp install` does, and the
     template it writes tells agents to run `vp test` — forbidden by §4. Without
     the markers the sync is a documented no-op, so do not re-add them: an empty
     marker pair is not enough, it just gets refilled. `vp run viteplus:verify`
     enforces this, with `--write` to empty a region that came back. -->
