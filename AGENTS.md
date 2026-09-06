# Project Instructions — lcabrera-stack

<!-- Audience: Claude, Gemini, and other non-GitHub agents — for GitHub Copilot see .github/copilot-instructions.md -->

This file provides guidance to AI agents when working with code in this repository. It contains the **universal, always-relevant** standards. Detailed per-file-type conventions live in `.claude/rules/` (see [Path-Specific Rules](#2-path-specific-rules)), and task workflows live in `.github/skills/`.

## 1. Project Overview

This is a **pnpm monorepo** built with the **Vite+** unified toolchain (`vp` CLI).

**This repository ships two products, split by who installs them.** The
**application stack** — `@lcabrera/ui`, `api`, `server`, `utils`, `node` — is
installed by another **application**. The **repo toolchain** —
`@lcabrera/tsconfig`, `vite-config`, `eslint-plugin`, `devkit`,
`repo-standards` — is installed by another **repository**. Ask which of the two
a change serves; a capability that serves neither is a signal to stop rather than
to add a package. The split is by consumer, not by build shape — `@lcabrera/ui`
publishes TypeScript source just as `devkit` publishes `.mjs`.

**What no in-repo run can validate is the delivery.** A `workspace:*` link
resolves the source directory, so a packed tarball's file modes never appear —
which is how `devkit`'s shipped git hooks once arrived inert. That is the reason
`vp run tarball:verify` exists: it packs both distributed packages and installs
them into a scratch repo outside this tree. It is chained into `check:safe` and
runs as its own CI step
([ADR-073](docs/decisions/ADR-073-publishing-gates-check-the-packed-tarball.md)).

**The `apps/` exist to exercise the packages, and that is the tie-breaker.** When
package cleanliness and app convenience pull
in opposite directions, the package wins. A package must stand on its own —
declared dependencies, a resolvable public surface, no reliance on a consumer's
tsconfig `paths` to make an import work — because it is meant to be consumed from
outside this repo, where none of this monorepo's wiring exists. The public
packages are held strictest for exactly that reason, and which those are is one
question with one answer: `vp run suppressions:packages`. This is why the
column-filter shapes are **duplicated**
in `@lcabrera/ui` and `@lcabrera/server` rather than shared through an elegant edge that
only resolves in-repo ([ADR-039](docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)).
Facing that call — promote it into a package, or write it twice?
[`docs/agents/cross-app-abstraction.md`](docs/agents/cross-app-abstraction.md)
walks the decision in order and links the ADR that owns each step.

**Two scopes, and the split carries meaning.** The publishable packages are
**`@lcabrera/*`**; the internal one (`ts-configs`) stays **`@repo/*`**. So the
import line tells you which side of the product boundary you are on: `@lcabrera/`
means it ships and has consumers outside this repo, `@repo/` means internal, change
it freely. A new package picks its scope by one question — does it ship? — and a
`@lcabrera/*` one inherits the never-baseline rule (below) and the invariants with it.
Do not "tidy" the two into one ([ADR-040](docs/decisions/ADR-040-npm-scope-for-the-public-packages.md)).
A package in **neither** scope means that question was never asked — that is how
the custom lint rules sat unscoped until they became `@lcabrera/eslint-plugin`
([ADR-057](docs/decisions/ADR-057-publish-the-custom-lint-rules.md)).

**The toolchain packages that used to sit in `@repo/*` publish, with this
repo's data taken out of them.**
[ADR-069](docs/decisions/ADR-069-publish-the-shared-toolchain.md) is that
history: `packages/node-runtime` is `@lcabrera/node`, `packages/vite-configs`
(with the one-plugin workspace folded in) is `@lcabrera/vite-config`, and
`packages/ts-configs` is the one **split** — `@lcabrera/tsconfig` holds the
factories and the writer, while `@repo/ts-configs` survives as the host of
`tsconfig.entries.ts`, this repo's own workspace roster. Adding a new hardcoded
repo fact to a published package now works against that.

**They are published on npm, and nothing but the version number stands between
a mistake and the registry** — `private` is off and each has a trusted publisher,
so a merged version bump publishes on its own, and **an npm version is permanent**.
The full publishing contract — the `exports`/`publishConfig` split, `files`, peer
dependencies, the API-surface gate, and the two rename traps that silently break a
consumer — lives in [`packages/CLAUDE.md`](packages/CLAUDE.md), which loads
whenever you work under `packages/`. Read it before editing any manifest there.

The apps are the harness. `apps/showcase` is a **React 19 + TypeScript +
StyleX + React Router** SSR application that puts the packages under load —
a feature-rich data Table with store-based state management, virtualization,
infinite scroll, and granular subscriptions via `useSyncExternalStore`. It is
also where cross-package integration is verified, since it is the only thing that
legitimately depends on several packages at once. Never put a guarantee a
_package_ relies on into an app.

### Monorepo Layout

`ls apps/ packages/` is the layout; `pnpm-workspace.yaml` is the authority. What
the listing cannot tell you is below.

**The public packages are held strictest: never baseline, scope, or
inline-disable a finding in any of them.** Which packages those are is stated in
exactly one place — the workspaces whose `.gitignore` covers
`eslint-suppressions.json` — and **`vp run suppressions:packages` prints that
roster**. Cite the command; do not copy its output into a second document. Every
check built on the rule resolves it the same way at runtime, so a new public
package is covered the day its gitignore changes. Do not restore the list here:
three surfaces once carried three different versions of it, and the narrowest
governed an autonomous merge (#993).

`packages/devkit` and `packages/repo-standards` are how the toolchain product
is delivered — the setup this repository hands to another repository, which is
the one thing that cannot be shipped by being described. They are the first public packages that ship **`.mjs` source
and do not build**: unlike a `.ts` file, an `.mjs` one loads from
`node_modules` as it is. That has a cost the built packages do not pay — the
API-surface extractor reads the entry through the workspace's tsconfig, so
without `allowJs` it loads no `.mjs` at all and snapshots an empty surface,
which passes exactly like a correct one.
`packages/ts-configs` is not
on that list because it never joins it: it is the split, so what became public is
the new `packages/tsconfig` above, and the surviving workspace stays private.
The publishing history lives in
[ADR-069](docs/decisions/ADR-069-publish-the-shared-toolchain.md).

`api`/`server` split on **runtime** and `utils`/`node` on **purity**, and both
splits are load-bearing, not cosmetic. The invariant to carry everywhere: **a
client-safe package may only depend on workspace packages that are themselves
client-safe**, enforced by `packages/ui`'s `check:public-api`. The topology and
what each tsconfig denies is in [`packages/CLAUDE.md`](packages/CLAUDE.md) and
[ADR-038](docs/decisions/ADR-038-public-package-topology-by-runtime.md)
(which supersedes the combined `data-access` package it replaced); why
publishing merged neither pair is
[ADR-069](docs/decisions/ADR-069-publish-the-shared-toolchain.md).

All source paths below (e.g. `src/components/`) are relative to `apps/showcase/` unless otherwise noted.

### Source Structure (apps/showcase/src/)

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

| Rule file                            | Applies to                                                      | Contents                                                                                                                                                                                   |
| ------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.claude/rules/typescript.md`        | `**/*.ts`, `**/*.tsx`                                           | Strict TS rules, `type` not `interface`, readonly, Args/Props/Result naming, file-name suffixes, FP/immutability, import alias                                                             |
| `.claude/rules/react-components.md`  | `**/*.tsx`, `**/*.jsx`, `**/*.stylex.ts`                        | Component bundle structure, declaration/props naming, barrel files, React 19 mandatory rules, StyleX-only styling                                                                          |
| `.claude/rules/testing.md`           | `**/*.test.*`, `**/*.spec.*`                                    | Vitest/Testing Library conventions, `vp run test` usage, coverage target                                                                                                                   |
| `.claude/rules/routes-data.md`       | `**/routes/**`, `**/services/**`, `**/*.api.ts`, config/entries | Loader/action data flow, zero `useEffect` fetching, store-pattern rule, error boundaries, Zod validation                                                                                   |
| `.claude/rules/scripts.md`           | `**/*.mjs`, `**/*.cjs`, `**/scripts/**/*.js`                    | Build/tooling script standards — JSDoc "why" header, small pure functions, effects at edges, `node:` builtins, 350-line size ceiling (`scripts:verify`)                                    |
| `.claude/rules/package-rationale.md` | `packages/**`, `.changeset/**`, `docs/decisions/**`             | A public package's rationale is written in the package's own vocabulary and never in a consumer's names — binding on prose, changesets, ADRs, PR bodies and commit messages, not only code |

## 3. Quick Skill Index

Skills are on-demand task workflows in `.github/skills/`. Each one's own
`description:` frontmatter says what it covers, and agents that support skills
already have that listing — so it is not repeated here. Use them as the first
stop for implementation patterns.

Selection guideline:

- **Working in complex UI state?** Start with `store-pattern`.
- **Writing English a person will read** (chat, PR/issue prose, docs,
  review comments)? `unslop` is **required**, not suggested — run it on the
  sentences before they are published. Template headings and commit subjects
  stay under `commit-and-pr`.
- **Routing/data mutations?** Use `react-router-framework-mode`.
- **React component implementation?** Use `react-19`.
- **Picking a scan?** `linter-checker` (mechanical lint),
  `fallow-code-checker` (fallow), `code-smell-zen` (diff smells),
  `code-smell-checker` (full-tree smells), `health-swarm` (repo-wide rot with
  evidence).
- **Auditing what has rotted repo-wide?** `health-swarm` — prefer a subset
  (`/health-swarm perf deps`) unless a full sweep is warranted.
- **Configuring or debugging a linter (Oxlint/eslint/Biome/Sonar)?** Use `lint-toolchain`.
- **Building against a published package, or writing acceptance criteria?** Use
  `product-requirement` — read [`docs/product/`](docs/product/README.md) for what
  a consumer must already be able to do, write a requirement when none covers the
  work, and flip one to `met` in the commit that earns it.
- **Implementing a backlog issue that has real acceptance criteria?** Use
  `refactor-verified`; the standard it enforces is
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

`vp run deps:refresh` moves that pin along with everything else, and CI runs on
it, so the gate verifies the new runtime before the PR can merge. **A local
checkout does not inherit it** — the vp shim is system-first, so the runtime comes
from whatever manages Node on your machine. When a refresh moves the pin, install
that version and repoint your default; otherwise your pre-push gate and CI are
running different runtimes, which is exactly the silent divergence `engineStrict`
exists to prevent.

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

There is deliberately **no `start:all`/`dev:all`**. One app is runnable, so `dev:showcase` and `start:showcase` are the commands and an "all" alias would just be a second name for one of them. Add one when a second app arrives, and say what it buys.

**`vp check` type-checks, but it is not `tsc` — both run, and `typecheck:all` is the authority.** `vp check`'s type pass is **tsgolint** (Oxlint's type-aware path, enabled by `lint.options.typeCheck` in the root `vite.config.ts`), and it does resolve each workspace's own strict `tsconfig.app.json` — `strict`, `noUncheckedIndexedAccess` and `noUnusedLocals` all fire under it. What it does **not** do is run the per-workspace `typecheck` scripts, and those carry work no linter replicates: `packages/ui` gates its public API against server-only `node:*` imports (`check:public-api`), and both React Router apps regenerate route types first. Every workspace now has a `typecheck` script, CI runs `vp run typecheck:all` as its own step in `check-safe.yml`, and `check:safe` chains it. Keep the two passes in sync: a new workspace gets a `typecheck` script **and** a tsconfig, or it silently falls back to the near-empty root `tsconfig.json` and is checked far more loosely than every other workspace (this is exactly how `utils`/`plugins`/`vite-configs` went un-strict for so long — `noUncheckedIndexedAccess` never fired there).

**tsconfigs are generated — never hand-edit them.** `packages/ts-configs/tsconfig.entries.ts` (this repo's per-workspace entries) + `packages/tsconfig/src/tsconfig.shared.ts` (the published factories) are the source of truth for every `tsconfig.app.json`/`tsconfig.node.json`; run `vp run --filter @repo/ts-configs generate` after changing either, then `vp fmt .`. A hand-edit survives exactly until the next unrelated regeneration silently reverts it — the `@lcabrera/ui` bare-specifier alias in both apps was lost this way and had to be folded back into the generator. If a config needs something bespoke, add it to the generator entry, not to the JSON.

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

**`test:all` vs `test:ci`.** Neither runs a suite that needs a database — the DB-bound smoke suites in `apps/showcase` gate on `SMOKE_DB`, and only `vp run --filter showcase test:smoke` sets it — so the two differ only in ordering: `test:ci` runs `showcase` last, via its own `test:ci`, so the coverage summary the PR comment reads is the fresh one. Keep using `test:ci` before pushing — it is what CI runs on a push to `main`; on a pull request CI runs `test:changed -- --ci` instead, and `check-safe.yml` picks between them by event.

**A workspace with real-Postgres tests must split them**: keep the full suite as `test`, and expose a `test:unit` (plus `test:coverage`) that `--exclude`s the DB-bound files. Without the split the whole workspace has to be dropped from `test:ci`, which silently takes its pure tests with it. Nothing here needs this today — `apps/showcase`'s DB-bound suites gate themselves in-file on `SMOKE_DB` rather than needing a task-level split, which is the other way to discharge this — and **the substitution is not built** — `packages/repo-standards/scripts/affected-tests.mjs` says so in its own header, and the only per-workspace substitution it carries is `COVERAGE_TASK_PACKAGE`. Build it when a DB-bound workspace arrives, mirroring `test:ci` in the root manifest; do not assume it is waiting.

### Fallow Static Analysis (run from repo root)

Fallow is configured once at the repo root (`.fallowrc.json`) and auto-detects every pnpm workspace — never add per-app fallow configs or dependencies. Scope any command's output with `-w`, e.g. `vp run fallow:dead-code -w 'apps/showcase'`.

`reports/fallow/` is the **single canonical location** for every fallow artifact; only `reports/fallow/baselines/` is tracked. The split is a rule, not a habit: a gate compares against it → tracked; it reports what a tool found → produced on demand ([ADR-049](docs/decisions/ADR-049-findings-reports-are-produced-on-demand.md)). **So there is no snapshot to read — run the command and read what it writes.**

Before a PR, run `vp run fallow:audit --base main`. CI runs `fallow audit --gate new-only` on every PR (`check-safe.yml`) — it fails only on newly-introduced dead code, complexity, or duplication.

**Always feed the audit real coverage** (`--coverage reports/fallow/coverage/coverage-final.json`, from `vp run coverage:merge`). Without it fallow _estimates_ coverage from whether a colocated test file exists, and at an estimated 0% every function with cyclomatic ≥ 5 breaches the CRAP threshold — an unfed audit reports trivially simple code as `critical`. Read a finding's **`exceeded`** field, not `severity`.

**`@vitest/coverage-v8` in the root manifest looks unused and is load-bearing** — it is an optional peer of vitest, which pnpm resolves only while some manifest declares it. Removing it takes every `--coverage` run down ([ADR-047](docs/decisions/ADR-047-declare-optional-peer-dependencies.md)).

Entry policy, the full output table, the glob-crosses-`/` trap and the coverage-lane details are in the **`fallow-code-checker` skill** ([CONFIGURATION.md](.github/skills/fallow-code-checker/CONFIGURATION.md)).

### Local Database Workflow (run from repo root)

Commands: [COMMANDS.md §4 → Database](COMMANDS.md#database). `vp run db:up` starts
local Postgres; seeding goes through `vp run --filter showcase seed`,
because `seed`/`db:seed` are **workspace scripts, not root scripts**.

**The showcase owns the DDL for the tables it serves and seeds itself**
([ADR-071](docs/decisions/ADR-071-split-the-demo-database-setup.md)) from
`apps/showcase/db/`, which is what creates `enterprise_orders`. The other
copy of `setup_large_data.sql` lives in a separate repository, so the
duplication ADR-071 describes is cross-repo and the two can drift with nothing
here to catch it.

It reads env from `docker/local/.env` and then the workspace's own `.env`. The frontend proxies `/api` to `http://localhost:3001` for the external-API lane, which means a server run from outside this repository.

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
11. **Never ignore, suppress, or omit a lint finding — verify, then fix.** Oxlint/eslint violations (including stylistic `unicorn/*` rules like `prefer-simple-condition-first` / `no-nested-ternary`) are real until you have read the flagged code and confirmed otherwise. Do **not** dismiss one as a false positive without checking, and do **not** silence a new one — no inline `// eslint-disable`/`oxlint-disable`, no rule-off in config, no hand-added `eslint-suppressions.json` entry. Fix the code (reorder operands, restructure logic, wire up/delete the export). If it is a genuine false positive, explain why rather than disabling. The public packages (§1) are held strictest — each one's `eslint-suppressions.json` is gitignored, so none is ever committed and none of them baselines.
12. **Claim shared work before you touch it.** Multiple agents and humans work this repo in parallel. Before non-trivial work, register it in [`docs/coordination/`](docs/coordination/README.md): check for an area overlap, then create a task file (`tasks/_TEMPLATE.md`) with the `area` globs you own, branch, and keep `status`/`updated` current until it merges. Never edit files inside another active task's `area` without coordinating. The register — not `~/.claude/plans/` scratch, which is invisible to everyone else — is the shared record. `vp run coordination:verify` (CI) keeps it honest. (See "Multi-Agent Coordination" in §7.)
13. **Commits and PRs follow the enforced format.** Every commit message is a Conventional Commit (`type(scope): subject`) and every PR has a conforming title plus every section of [`.github/pull_request_template.md`](.github/pull_request_template.md) — checked by the `commit-msg` git hook locally and the `pr-standards.yml` gate in CI. Do not restate the template's section list here or anywhere else; open the template. The one spec is `packages/repo-standards/scripts/commit-convention.mjs`; don't restate its type list elsewhere, and (Rule 11) fix a failing message/description rather than weakening the check. (See "Commit & PR Standards" in §7 and the `commit-and-pr` skill.)
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

- Architecture docs live on **systems** whose wiring is not visible from one
  file (Table, Form, the query builders), not on every component folder
  ([ADR-088](docs/decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md)).

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

**No comment above a declaration, no prose inside a function or component body,
and none inside a type declaration either.** Three positions, not two: the JSDoc
block over the declaration, any explanation within a body, and a note between a
type's members — an `Args`/`Props`/`Result` type is where this repository writes
them most, and it is where they rot identically
([ADR-104](docs/decisions/ADR-104-the-no-comment-rule-covers-a-type-declaration.md)).
"Above a declaration" is the general form and covers a plain `const` too; a
command descriptor's JSDoc named a derivation its only consumer had stopped using
([#850](https://github.com/luciocabrera/lcabrera-stack/issues/850)). A name, a
signature and the types already say what the code is, and an explanation next to
code is the copy nothing keeps true — which is the failure every gate in this
file exists to catch. If the code can be made clearer instead, do that.

**The exemptions are narrow.** The **file-level header** stays: the file's
**first comment block**, in a source file of any extension, saying why the module
exists rather than what a declaration below it is.
[`.claude/rules/scripts.md`](.claude/rules/scripts.md) is where that header is
additionally **mandatory** — for a `.mjs`/`.cjs` script, one short block giving
the file's purpose, its usage and its exit codes, exactly as that rule specifies.
It is permitted everywhere, which is what makes it the home for a trap in a
`.ts` file that has no ADR or issue to carry it. Only the first block: a second
one below it is a comment about the declaration under it. **JSDoc a
build reads** stays: `@param`, `@returns`, `@type` and the rest of the
annotations a tool consumes, because a published `.mjs` package's declarations
are derived from them and dropping one publishes an option defaulting to `[]` as
`never[]` ([`packages/CLAUDE.md`](packages/CLAUDE.md) owns that contract). That
exemption covers the **annotations**, not prose that happens to share
their block: the test is whether removing the text changes what a tool emits —
which is also why `@deprecated` and `@internal` stay in a `.ts` file, where the
rest of the annotations do not. And a **one-line note on a member of an exported
type** stays: that member is a published surface, so state the precondition, the
default or the encoding there and nothing else — not the rationale, and not a
pointer to a record an installer cannot open.

**The explanation still has to live somewhere, and there are two homes.** A
decision — why this approach and not the one that looks equally reasonable —
belongs in the ADR that owns it, in [`docs/decisions/`](docs/decisions/). Everything
else — the investigation, the measurement, the trap you hit on the way — belongs
in the **pull request or the issue**, which is dated and immutable and cannot be
mistaken for current fact. Neither is optional: deleting the reasoning instead of
moving it is not compliance.

The record is
[ADR-095](docs/decisions/ADR-095-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md),
amended by
[ADR-104](docs/decisions/ADR-104-the-no-comment-rule-covers-a-type-declaration.md)
for the third position,
which also states what the rule costs and which paragraph of
[ADR-088](docs/decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md)
it corrects.

**Nothing enforces this mechanically, and that is deliberate.** A lint rule for
it was built and removed: deciding whether a given comment carries something no
declaration can say is a judgement, and every mechanical proxy for it —
the `export` keyword, a character budget, an adjacency walk over the file's
leading comments — drew the line somewhere a reader would not, so the rounds
went to arguing the proxy rather than the code
([#1028](https://github.com/luciocabrera/lcabrera-stack/issues/1028)). Hold this
by review, and when a comment is the only thing in dispute, delete it rather
than debate it — keep it only where its omission would cost a reader something
the code does not say.

**Never put a changing number in a comment or a doc.** Counts, file totals,
finding tallies and measurements are true on the day they are written and wrong
soon after, and nothing checks them — the same silent rot that made
`commands:verify`, `docs:verify` and `scripts:verify` necessary in the first
place. Name the command that produces the number instead (`vp run
suppressions:list`, `vp lint . --format=json`). A count is only allowed where a
gate asserts it, such as `count` in the suppressions register.

**A dependency's major version is the same shape, and it rotted the same way.**
Name the framework, not the major it is on — "React Router framework mode",
never the name followed by a version number. The catalog in
`pnpm-workspace.yaml` is where a version is
declared, and prose repeating it is a second declaration nothing keeps in step —
the docs claimed 7 while the catalog pinned 8, across the rule file agents load
for every route change and the copy `@lcabrera/devkit` ships to other
repositories (#962). A version belongs in prose only where it is a **floor** a
reader must clear ("middleware requires v7.9.0+"), which stays true as the
dependency moves.

The durable place for measurements and investigation narrative is the **PR or the
issue** — dated, immutable, and not something a later reader mistakes for current
fact. That is the same split the comment rule above draws, stated here for the
numbers and the versions specifically.

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
   **draft PR early** (the human-visible progress surface). The task file is
   committed **on that branch**, in the same PR as the work — there is no
   claim-only PR, and cross-branch visibility comes from `coordination:verify`
   reading every live branch on `origin`
   ([ADR-074](docs/decisions/ADR-074-the-claim-lives-on-its-work-branch.md)).
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
are in the coordination README.

### Architecture-First Workflow

Before making a code change, read the docs that actually apply — not every
markdown file that sits nearby. The map is in [`docs/README.md`](docs/README.md);
the decision that architecture files describe systems, not folders, is
[ADR-088](docs/decisions/ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md).

**Where to look:**

- The owning workspace's `INVENTORY.md` — does an artifact already cover this?
- `packages/ui/src/PATTERNS.md` when creating or modifying a UI component
- The **system** `ARCHITECTURE.md` only when the change is inside a system
  whose wiring is not visible from one file (Table and its stores, Form, the
  query builders). Do not read, create, or update a per-leaf architecture file
  for a component whose name and types already say what it is.
- **The ADRs covering the area** — `vp run adr:list` prints every one with its
  title; if you cannot run a command, **list the home's directory**
  (`ls docs/decisions/`, or open the directory rather than the file on GitHub)
  — the filenames carry the titles in kebab case. What no longer works is
  opening a home's `README.md` expecting an index: it says what the home holds
  and deliberately lists no ADRs, because a committed list is one region every
  ADR branch appends to
  ([ADR-075](docs/decisions/ADR-075-the-index-does-not-list-the-adrs.md)). There
  is now exactly one home, [`docs/decisions/`](docs/decisions/), and **a number
  identifies exactly one ADR** — `registers.adrGrandfatheredDuplicates` in
  `devkit.config.json` is empty, so every repeat is a collision `vp run
adr:verify` rejects. Two homes existed while the showcase app kept its own;
  that is why an older ADR may cite a number, or a path, that now resolves
  somewhere else.

Do **not** create an `ARCHITECTURE.md` because the directory is new. Create one
only for a system: multiple files, non-local data flow, constraints the code
cannot say. A Props table, a file-tree listing, and a mermaid of the function
body are copies of the code — they belong nowhere.

### Reuse Before You Build

Before creating any new component, hook, utility, constant, or type, **consult `src/INVENTORY.md`** first.

1. If an artifact already exists that covers the need — **use it**.
2. If an artifact almost covers the need but is too specific — **enhance it to be more generic** rather than creating a new one. Update its `INVENTORY.md` description after (one sentence).
3. Only create something new when nothing in the inventory is a reasonable fit.

When in doubt: a codebase with 18 components and 25 utilities that each do one thing well is better than 40 components and 50 utilities with overlapping concerns.

### Commit & PR Standards

Commit messages and PR descriptions in this repo are **enforced**, not just
conventional — the same way `commands:verify` keeps COMMANDS.md honest. The one
spec is [`packages/repo-standards/scripts/commit-convention.mjs`](packages/repo-standards/scripts/commit-convention.mjs);
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
