# Project Instructions — vite-react-compiler

<!-- Audience: Claude, Gemini, and other non-GitHub agents — for GitHub Copilot see .github/copilot-instructions.md -->

This file provides guidance to AI agents when working with code in this repository. It contains the **universal, always-relevant** standards. Detailed per-file-type conventions live in `.claude/rules/` (see [Path-Specific Rules](#path-specific-rules)), and task workflows live in `.github/skills/`.

## 1. Project Overview

This is a **pnpm monorepo** built with the **Vite+** unified toolchain (`vp` CLI). The primary app is a **React 19 + TypeScript + StyleX + React Router 7** application with SSR support (`apps/react-router/`). It demonstrates enterprise-grade patterns including a feature-rich data Table component with custom store-based state management, virtualization, infinite scroll, and granular subscriptions via `useSyncExternalStore`.

### Monorepo Layout

```
apps/
├── react-router/     # Main SSR frontend app (React 19 + StyleX + React Router 7)
├── admin_system/     # Separate React Router SSR admin app (CQMS routes)
├── api-server/       # Express + PostgreSQL REST API (port 3001)
├── api-server-fast/  # Fastify alternative API server
├── scan-orchestrator/# Standalone CQMS scan runner (Postgres LISTEN + ws server)
└── shared/           # Shared code between apps
packages/
├── agent-runner/        # Spawns the Claude Agent SDK CLI subprocess
├── data-access/         # Reusable server/api code — browser fetch (src/api) + Postgres (src/db)
├── eslint-local-rules/  # Custom lint rules for this repo
├── node-runtime/        # Process-lifecycle primitives for long-running services (signals)
├── plugins/             # Shared Vite plugins
├── scan-ingestion/      # CQMS scan ingestion core + migrations
├── ts-configs/          # Shared TypeScript configurations (generated — see its README)
├── ui/                  # Shared UI component library
├── utils/               # Shared utilities — pure and side-effect free (see its ARCHITECTURE.md)
└── vite-configs/        # Shared Vite config factories
```

That is **16 workspaces** — the count several rules below depend on. `packages/ui`
and `packages/data-access` are becoming public packages and are held strictest:
never baseline, scope, or inline-disable a finding in either.

`utils` and `node-runtime` split on purity, and the split is deliberate:
`@repo/utils` guarantees pure, side-effect-free helpers, so anything that must
touch the process (signal handlers, exit paths) belongs in `@repo/node-runtime`
instead of eroding that guarantee.

All source paths below (e.g. `src/components/`) are relative to `apps/react-router/` unless otherwise noted.

### Tech Stack

- **Runtime:** React 19 (with React Compiler via `babel-plugin-react-compiler`)
- **Routing:** React Router 7 (with SSR, loaders, actions)
- **Styling:** StyleX (`@stylexjs/stylex`) — exclusive, no CSS modules, no styled-components
- **Toolchain:** Vite+ (`vp` CLI) wrapping Vite, Rolldown, Vitest, Oxlint, Oxfmt
- **Language:** TypeScript (strict mode)
- **Package Manager:** pnpm (managed through `vp`)

### Source Structure (apps/react-router/src/)

```
src/
├── components/          # Reusable UI components (Button, Card, Modal, Table, etc.)
│   ├── Table/           # Enterprise data table with custom store architecture
│   └── PATTERNS.md      # Naming conventions, StyleX order, drawer-section pattern
├── constants/           # App-level constants
├── contexts/            # App-level contexts (GlobalSettings, Notification, Theme)
├── design-system/       # StyleX tokens, themes, design constants
├── features/            # Route-isolated feature modules (e.g. showcase/)
├── hooks/               # Shared hooks (useStore, useVirtualization, useTheme, ...)
├── routes/              # React Router route modules (loaders, actions, components)
├── services/            # External API integrations (*.api.ts)
├── types/               # Global type definitions
├── utils/               # Shared utilities (formatters, storage, URL state)
├── INVENTORY.md         # Artifact catalog — consult before creating anything new
├── root.tsx             # App root with providers
├── routes.ts            # Route configuration
└── entry.server.tsx     # SSR entry point
```

---

## 2. Path-Specific Rules

Detailed conventions are split into rule files under `.claude/rules/`, each scoped by glob patterns in its `paths:` frontmatter. **Claude Code loads them automatically when editing matching files. Other agents (Copilot, Gemini, etc.): read the matching rule file below before editing files it covers — nothing there is optional.**

| Rule file                           | Applies to                                                      | Contents                                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `.claude/rules/typescript.md`       | `**/*.ts`, `**/*.tsx`                                           | Strict TS rules, `type` not `interface`, readonly, Args/Props/Result naming, file-name suffixes, FP/immutability, import alias |
| `.claude/rules/react-components.md` | `**/*.tsx`, `**/*.jsx`, `**/*.stylex.ts`                        | Component bundle structure, declaration/props naming, barrel files, React 19 mandatory rules, StyleX-only styling              |
| `.claude/rules/testing.md`          | `**/*.test.*`, `**/*.spec.*`                                    | Vitest/Testing Library conventions, `vp run test` usage, coverage target                                                       |
| `.claude/rules/routes-data.md`      | `**/routes/**`, `**/services/**`, `**/*.api.ts`, config/entries | Loader/action data flow, zero `useEffect` fetching, store-pattern rule, error boundaries, Zod validation                       |

## 3. Quick Skill Index

Skills are on-demand task workflows in `.github/skills/`. Use them as the first stop for implementation patterns:

| Skill                         | Use For                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `store-pattern`               | Table-style split-context external store architecture with selector/action boundaries                       |
| `quality-gate-workflow`       | **Canonical** post-change validation sequence — the single source of truth for the gate                     |
| `react-19`                    | React 19 component and compiler-safe patterns                                                               |
| `react-router-framework-mode` | React Router framework mode data, actions, forms, navigation, error handling                                |
| `codebase-explorer`           | Multi-phase codebase investigation with context isolation and crash-safe scratchpads                        |
| `code-smell-checker`          | Baseline maintainability audits and tech-debt triage                                                        |
| `code-smell-zen`              | Diff-based smell review against target branch                                                               |
| `fallow-code-checker`         | Full fallow monorepo hygiene scan with prioritized report (`vp run fallow:full` from root; scope with `-w`) |

Selection guideline:

- **Working in complex UI state?** Start with `store-pattern`.
- **Finishing any code change?** Run `quality-gate-workflow`.
- **Routing/data mutations?** Use `react-router-framework-mode`.
- **React component implementation?** Use `react-19`.
- **Understanding unfamiliar code before changing it?** Use `codebase-explorer`.

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

**Never use pnpm/npm/yarn directly.** All operations go through `vp`:

| Task                 | Command                                                                                |
| -------------------- | -------------------------------------------------------------------------------------- |
| Install dependencies | `vp install`                                                                           |
| Dev server           | `vp dev`                                                                               |
| Build for production | `vp run build` (runs `react-router build` and emits `build/server/index.js`)           |
| Lint (with fix)      | `vp lint . --fix`                                                                      |
| Lint (check only)    | `vp lint .`                                                                            |
| Format               | `vp fmt .`                                                                             |
| Format check         | `vp fmt --check .`                                                                     |
| Type check           | `vp run typecheck` (real tsc) — `vp check` runs tsgolint, which is a different pass    |
| Run tests            | `vp run test` (never `vp test` — see the `quality-gate-workflow` skill)                |
| Full validation      | The canonical quality gate — see [Post-Change Quality Gate](#post-change-quality-gate) |
| Add a package        | `vp add <package>`                                                                     |
| Remove a package     | `vp remove <package>`                                                                  |

### Monorepo-Wide Commands (run from repo root)

Root scripts are **orchestration only** — anything project-specific lives in that project's own package.json. The `<task>:all` family fans out recursively in workspace dependency order.

**Full list: [COMMANDS.md §4](COMMANDS.md#4-root-orchestration-scripts).** The
policy that governs them:

There is deliberately **no `start:all`/`dev:all`**: `car-sales-api` and `car-sales-api-fast` are performance-comparison alternatives serving the same domain and must never run at the same time — always pick one combo.

**`vp check` type-checks, but it is not `tsc` — both run, and `typecheck:all` is the authority.** `vp check`'s type pass is **tsgolint** (Oxlint's type-aware path, enabled by `lint.options.typeCheck` in the root `vite.config.ts`), and it does resolve each workspace's own strict `tsconfig.app.json` — `strict`, `noUncheckedIndexedAccess` and `noUnusedLocals` all fire under it. What it does **not** do is run the per-workspace `typecheck` scripts, and those carry work no linter replicates: `packages/ui` gates its public API against server-only `node:*` imports (`check:public-api`), and both React Router apps regenerate route types first. Every one of the 16 workspaces now has a `typecheck` script, CI runs `vp run typecheck:all` as its own step in `check-safe.yml`, and `check:safe` chains it. Keep the two passes in sync: a new workspace gets a `typecheck` script **and** a tsconfig, or it silently falls back to the near-empty root `tsconfig.json` and is checked far more loosely than every other workspace (this is exactly how `utils`/`plugins`/`vite-configs` went un-strict for so long — `noUncheckedIndexedAccess` never fired there).

**tsconfigs are generated — never hand-edit them.** `packages/ts-configs/generate.ts` + `tsconfig.shared.ts` are the source of truth for every `tsconfig.app.json`/`tsconfig.node.json`; run `vp run --filter @repo/ts-configs generate` after changing either. A hand-edit survives exactly until the next unrelated regeneration silently reverts it — the `@repo/ui` bare-specifier alias in both apps was lost this way and had to be folded back into the generator. If a config needs something bespoke, add it to the generator entry, not to the JSON.

**Three linters run, and none of them is `vp check`.** Oxlint (`vp lint`) covers the whole tree from the root; the eslint pass (`vp run lint:eslint` / `lint:eslint:check`) exists in all 16 workspaces — React workspaces use `@repo/vite-configs/eslint-custom-rules`, node/library workspaces use `@repo/vite-configs/eslint-base-custom-rules` (same stack minus React/StyleX, and without `clean-import-paths`, which strips the import extensions node-resolution code requires). Inherited eslint violations are baselined per workspace in `eslint-suppressions.json` (ESLint bulk suppressions) — **new violations fail the gate**: CI runs `vp run -r lint:eslint:check` as its own step in `check-safe.yml`, because `vp check` covers only fmt + Oxlint + the tsgolint type pass and would let every eslint-only finding through. Burn debt down and shrink the baseline with `npx eslint . --config eslint.config.mjs --prune-suppressions`. Never add new entries by hand, and never inline-`// eslint-disable`/`oxlint-disable` a finding or switch the rule off in config — **verify, then fix the code instead** (see Non-Negotiable Rule 11). A lint finding is real until you've read the flagged code and confirmed otherwise; stylistic `unicorn/*` rules (e.g. `prefer-simple-condition-first`, `no-nested-ternary`) get fixed by restructuring, never silenced. **Exception: `packages/ui` is never silenced** — it must not carry an `eslint-suppressions.json` at all; every finding there gets fixed, never baselined or disabled.

**Biome is the third linter** (`vp run lint:biome:check`, CI step in `check-safe.yml` after the eslint pass, and a pre-commit `staged` entry in the root `vite.config.ts`). It is configured **once at the root** in `biome.jsonc` and runs one repo-wide pass — like Oxlint, unlike the per-workspace eslint fan-out. Do not add per-workspace `biome.jsonc` files or `lint:biome` scripts; `overrides` already scope per project. Full rationale — including why it is lint-only and why it is not a CQMS scanner — is in [ADR-035](docs/cqms/decisions/ADR-035-biome-third-linter.md). Four constraints hold it in place:

- **Formatter and assist are OFF** (`formatter.enabled: false`, `assist.enabled: false`). Oxfmt owns formatting and eslint-perfectionist owns import order. Turning either on restarts the formatter/linter fight that the `eslint-suppressions.json` ignore rule already had to settle once.
- **Domains are scoped per project, not global.** The `react` domain is enabled in an `overrides` entry covering only the three React workspaces (`apps/react-router`, `apps/admin_system`, `packages/ui`) — enabling it globally would apply React rules to the Express/Fastify/node workspaces. `test` is scoped to test files; `project` runs repo-wide. Both add zero findings today and exist to guard future code.
- **`domains: { react: "recommended" }` does NOT enable every react rule** — this is the trap. `noNestedComponentDefinitions` and `noDuplicatedSpreadProps` are react-domain rules that fire only under `"all"` or when listed explicitly, so they are pinned by name at `error` in the same override (`noDuplicatedSpreadProps` also defaults to `warn`, which would not fail the gate). Verify any new rule with a deliberate violation before trusting a green run: a rule that is off reports the same clean pass as code that is correct.
- **Do not adopt `domains: { react: "all" }`.** It adds ~180 findings that contradict this repo's own ADRs — `noJsxPropsBind`/`noLeakedRender` vs ADR-004 (React Compiler owns memoization) and `useComponentExportOnlyModules` vs ADR-007 (barrel exports).
- **The config is `biome.jsonc`, not `biome.json`, and that is load-bearing.** Biome's config parser rejects `//` comments in a `.json` file — and it does not fail loudly: it **discards the entire config and silently falls back to defaults**, which lints `node_modules` and reports tens of thousands of findings (or, on a single file, a plausible-looking count with your `overrides` quietly not applied). Every rule scoped off here needs its reason next to it, so the file must stay `.jsonc`. If Biome ever starts reporting absurd counts or ignoring an override, suspect a config parse error first: `biome lint <file> 2>&1 | grep parse`.

Six rules are scoped off in `overrides`, each with its reason inline — all six are cases where Biome is wrong, not where the code is (`noThenProperty`, `useExhaustiveDependencies`, `noAriaHiddenOnFocusable`, `noNoninteractiveTabindex`, `useSemanticElements`, `noStaticElementInteractions`). **ADR-035 §5 is the table** listing each with its justification; read it before adding a seventh, and match that bar. Four of the six are Biome mismodelling an ARIA pattern the code implements correctly (window splitter, APG tabs panel, non-grid table row, conditional tooltip role).

**Prefer a rule option over a scope-off.** An option keeps the rule live everywhere else; a scope-off blinds it for a whole file. `noLabelWithoutControl` is the worked example: a `<label>` wrapping the `Checkbox` _component_ is correct HTML — Biome just cannot see through the component boundary — so `inputComponents: ["Checkbox"]` teaches it the name instead of disabling it, and a bare `<label>` with no control still fails. Add future input-rendering components to that list.

**Biome conflicts with eslint on how to return "nothing" from a `map` callback.** `useIterableCallbackReturn` demands a returned value, while `unicorn/no-null` bans `null` and `unicorn/no-useless-undefined` bans `undefined` — all three spellings fail one linter or the other. Restructure instead: `filter` the empty cases out before the `map`, so the callback always returns an element (`NotificationCenter.component.tsx` is the worked example). The same pairing bites nullish checks: `== undefined` trips Biome's `noDoubleEquals` and `== null` trips `unicorn/no-null`, so lean on arrays/objects always being truthy (`merge-arrays.util.ts`).

Rule 11 applies to Biome exactly as it does to the other two: no `// biome-ignore`, no rule-off to dodge a real finding, and nothing baselined in `packages/ui`.

**Lint JSON reports** follow the fallow output convention: `vp run lint:report` (script: `scripts/generate-lint-reports.mjs`, supports `--only=biome|eslint|oxlint`) regenerates `reports/oxlint/full-latest.json` (one repo-wide `vp lint . --format=json` run), `reports/eslint/full-latest.json` (the standard eslint `--format json` result array merged across all 16 workspaces, repo-relative paths), and `reports/biome/full-latest.json` (one repo-wide `biome lint . --reporter=json` run — root-only, mirroring the gate, since `biome.jsonc`'s `overrides` already scope the react domain and there is nothing to fan out). All three are tracked. ESLint runs in check mode — regenerating a report never mutates sources — and the baselined debt is visible per file in each entry's `suppressedMessages`, so the report is the place to inspect what the suppressions actually cover.

Known constraint: `scan-orchestrator`'s queue integration test shares the local CQMS Postgres queue — while `vp run dev:cqms` is running, the live orchestrator races the test for queued scans and `vp run test:all` can flake on `runQueuedScan.test.ts` (duplicate `reports_scan_id_key`). Stop the CQMS dev session before a full test run, or treat that single failure as environmental.

**`test:all` vs `test:ci`.** `test:all` runs every workspace and needs a database. CI has no Postgres, so its unit-tests job runs `vp run test:ci`, which is every DB-free suite in the repo: each workspace's `test`, except that `@repo/scan-ingestion` and `@repo/scan-orchestrator` contribute their DB-free `test:unit` subsets (their full `test` tasks stay real-Postgres, so `test:all` still covers everything), and `vite-react-compiler` runs last via its own `test:ci` so the coverage summary the PR comment reads is the fresh one. Run `vp run test:ci` before pushing if you don't have a DB up.

**A workspace with real-Postgres tests must split them**, the way `scan-ingestion` and `scan-orchestrator` do: keep the full suite as `test`, and expose a `test:unit` (plus `test:coverage`) that `--exclude`s the DB-bound files. Without the split the whole workspace has to be dropped from `test:ci`, which silently takes its pure tests with it.

### Fallow Static Analysis (run from repo root)

Fallow is configured once at the repo root (`.fallowrc.json`) and auto-detects every pnpm workspace — never add per-app fallow configs or dependencies. Scope any command's output with `-w`, e.g. `vp run fallow:dead-code -w 'apps/react-router'`.

**Entry policy**: `entry` in `.fallowrc.json` is only for files invoked outside the import graph (root/app scripts, skill runner scripts, vite config fragments in `config/` dirs, CLIs run via `node`). Package/framework entry points are auto-detected — do not enumerate workspaces. Caution: fallow's `*` glob crosses `/`, so a pattern like `apps/*/config/**` also swallows `src/config/` files and silently masks real findings — keep config-dir entries as explicit paths and verify with `vp run fallow:dead-code` that the issue count doesn't drop unexpectedly after editing entries.

**Output convention** — `reports/fallow/` is the **single canonical location** for every fallow artifact. Scripts, skills, agents, docs, and developers all write to and read from it; never invent another output path.

| Path                                              | Tracked?   | Contents                                                                            |
| ------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `reports/fallow/*-latest.json`                    | tracked    | Latest scan snapshots (`full-latest.json`, `dead-code-latest.json`, …)              |
| `reports/fallow/complexity-threshold-analysis.md` | tracked    | Human summary regenerated by `vp run fallow:refresh-report`                         |
| `reports/fallow/baselines/`                       | tracked    | Audit baselines (inherited debt excluded from the CI gate)                          |
| `reports/fallow/coverage/coverage-final.json`     | gitignored | Merged Istanbul coverage fed to `fallow audit --coverage` (`vp run coverage:merge`) |
| `reports/fallow/runs/<timestamp>/`                | gitignored | Per-run skill/agent artifacts (`fallow.raw.json`, `report.md`, `report.json`)       |

Sole exception: CQMS UI-triggered scans run by `apps/scan-orchestrator` use their own `.tmp/scan-orchestrator/<scan_id>/` workspace — their results land in the CQMS database, not the filesystem.

The commands live in [COMMANDS.md §4 → Fallow](COMMANDS.md#fallow-static-analysis).
Before a PR, run `vp run fallow:audit --base main`. The policy:

CI runs `fallow audit --gate new-only` on every PR (`check-safe.yml`) — it fails only on newly-introduced dead code, complexity, or duplication; inherited debt is covered by baselines in `reports/fallow/baselines/`.

**Always feed the audit real coverage** (`--coverage reports/fallow/coverage/coverage-final.json`, produced by `vp run coverage:merge`; the CI job does this for you). Fallow scores CRAP as `cyclomatic² × (1 − coverage)³ + cyclomatic` against a threshold of **30**, and with no coverage data it _estimates_ coverage from whether a colocated test file merely exists (`none` → 0%, `partial` → 40%, `high` → 85%). At an estimated 0%, **every function with cyclomatic ≥ 5 breaches the threshold** — so an unfed audit reports trivially simple code (`login.action.ts`, cyclomatic 5 / cognitive 2) as `critical`. When triaging a complexity finding, read its **`exceeded`** field, not `severity`: `crap` alone means "untested", while `all`/`cognitive` means genuinely complex. `coverage_source: "mixed"` is expected — files with no tests at all have nothing to measure and still fall back to the estimate.

`vp run coverage:merge` (`scripts/merge-coverage.mjs`) runs `test:coverage` in the **DB-free** workspaces only (`data-access`, `node-runtime`, `scan-ingestion`, `ui`, `admin_system`, `scan-orchestrator`) and merges their reports. Coverage must never require Postgres: the first attempt at this lever was reverted (2026-07-14) because it ran scan-ingestion's `queries/*` suites in CI, where `getPool()` → `readEnvConfig()` throws on the missing `DB_*`. That is why `@repo/scan-ingestion` splits `test` (full, needs a DB) from `test:unit` / `test:coverage` (DB-free subset).

### Local Database Workflow (run from repo root)

Commands: [COMMANDS.md §4 → Database](COMMANDS.md#database). `vp run db:up` starts
local Postgres; seeding goes through `vp run --filter car-sales-api seed`, because
`seed`/`db:seed` are **api-server scripts, not root scripts**.

The API server (`apps/api-server/`) reads env from `docker/local/.env`. The frontend proxies `/api` to `http://localhost:3001`.

**Critical:** Import Vite config from `vite-plus`, not `vite`, for tooling integration. Example: `import { defineConfig } from 'vite-plus'`. For tests, import test utilities from `vitest` directly (e.g. `import { expect, test, vi } from 'vitest'`).

### Agent Checklist

- Run `vp install` after pulling changes and before starting work.
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
6. **Every function is pure by default; never mutate data or props** — functional array ops everywhere; side effects only in designated homes (action hooks, event handlers, providers/loaders, `*.service.ts`/`*.api.ts`). (`.claude/rules/typescript.md`)
7. **React Compiler handles memoization** — favor correct code over manual optimization (ADR-004). Table performance comes from granular selector subscriptions, row virtualization, and split contexts.
8. **Use `@/` alias for `src/`** — relative imports only within the same directory.
9. **No explicit return types on functions/hooks/components — let TypeScript infer** — annotate only when inference genuinely fails (recursion, overloads, complex conditional types) or must be widened. (`.claude/rules/typescript.md`)
10. **Never use workaround-only fixes** — always address and solve the underlying issue. If there is any doubt about intent, trade-offs, or risk, ask the user before applying a workaround or partial fix.
11. **Never ignore, suppress, or omit a lint finding — verify, then fix.** Oxlint/eslint violations (including stylistic `unicorn/*` rules like `prefer-simple-condition-first` / `no-nested-ternary`) are real until you have read the flagged code and confirmed otherwise. Do **not** dismiss one as a false positive without checking, and do **not** silence a new one — no inline `// eslint-disable`/`oxlint-disable`, no rule-off in config, no hand-added `eslint-suppressions.json` entry. Fix the code (reorder operands, restructure logic, wire up/delete the export). If it is a genuine false positive, explain why rather than disabling. `packages/ui` is held strictest — it carries no suppressions file at all (§4).

## 6. Security

- Protect routes with authentication guards.
- Never commit secrets — use validated environment variables (Zod schema).
- Never commit sensitive data in logs or error messages.
- Never commit .env files or credentials.

---

## 7. Documentation & Workflow

- JSDoc comments on all exported functions, types, and components.
- Each feature directory should have a README.
- Architecture docs live in `apps/react-router/docs/` and component-level `ARCHITECTURE.md` files.

### Architecture-First Workflow

Before making **any** code change, read every `ARCHITECTURE.md` that covers the files you are about to touch. These files document intent, data flow, and constraints that are not always visible from the code alone.

**Where to look:**

- The component/hook/util directory being modified (e.g. `src/components/Table/ARCHITECTURE.md`)
- Parent directories if the change crosses boundaries (e.g. `src/hooks/ARCHITECTURE.md`)
- Shared type files (`src/types/ARCHITECTURE.md`) when filter or UI types are involved
- `src/components/PATTERNS.md` — always read this before creating or modifying any component; it defines naming conventions, StyleX composition order, the drawer-section pattern, filter contract, context+store pattern, and props-forwarding rules
- `docs/decisions/` — read the relevant ADR(s) before working in an area they cover: Modal → ADR-001, Tooltip → ADR-002, store → ADR-003, memoization/React Compiler → ADR-004, styling → ADR-005, infinite-scroll prefetch → ADR-006, barrel-export boundaries → ADR-007, primary-key sort tiebreaker / columns-derived id → ADR-008, filter-options fetch descriptors → ADR-009, cookie persistence via `/_action/persist-cookie` → ADR-010

If no `ARCHITECTURE.md` exists yet for the area you are changing, create one **before** implementing.

### Reuse Before You Build

Before creating any new component, hook, utility, constant, or type, **consult `src/INVENTORY.md`** first.

1. If an artifact already exists that covers the need — **use it**.
2. If an artifact almost covers the need but is too specific — **enhance it to be more generic** rather than creating a new one. Update its `ARCHITECTURE.md` row and `INVENTORY.md` description after.
3. Only create something new when nothing in the inventory is a reasonable fit.

When in doubt: a codebase with 18 components and 25 utilities that each do one thing well is better than 40 components and 50 utilities with overlapping concerns.

### Post-Change Quality Gate

The canonical validation sequence is owned by the **`quality-gate-workflow` skill** — invoke it after every code change. In short (run from `apps/react-router/`, in order, fix failures before proceeding):

```bash
vp fmt .                    # 1. auto-format (Oxfmt)
vp lint .                   # 2. lint (Oxlint) — fix all reported issues (use --fix first)
vp run lint:eslint:check    # 3. eslint custom-rules pass — NOT covered by `vp check` (autofix: `vp run lint:eslint`)
vp run lint:biome:check     # 4. Biome pass — NOT covered by `vp check`; run from the ROOT (autofix: `vp run lint:biome`)
vp check                    # 5. fmt + Oxlint + tsgolint type pass — zero errors required
vp run typecheck            # 6. real tsc for this workspace — NOT the same pass as step 5
vp run test                 # 7. unit/integration tests — all must pass (never `vp test`)
```

Steps 3, 4 and 6 are the ones that get skipped, and none is redundant:

- **Step 3** — `vp check` is Vite+'s built-in fmt + **Oxlint** + tsgolint and never runs the eslint pass, so `perfectionist` import/module ordering, the react/stylex rule sets, and `local-rules` surface only there.
- **Step 4** — `vp check` does not run Biome either. Unlike the other two linters this is a **root-only, repo-wide** pass; there is no per-workspace `lint:biome` script, because `biome.jsonc`'s `overrides` already scope the react domain to the three React workspaces.
- **Step 6** — `vp check`'s type pass is tsgolint, not `tsc`, and it knows nothing about the workspace's `typecheck` script. In `packages/ui` that script is also what runs `check:public-api` (the server-only `node:*` import guard); in the React Router apps it regenerates route types first.

From the repo root, `vp run typecheck:all` covers all 16 workspaces in dependency order, and `vp run check:safe` chains the whole gate the way CI does. While iterating, `vp run lint` in a workspace chains both lint autofixes (`vp lint . --fix` then `vp run lint:eslint`) and is the fastest loop.

### Documentation Update Rule

After the quality gate passes, update every doc affected by the change:

- **Props added/removed** → update the Props table in the component's `ARCHITECTURE.md`.
- **Render flow changed** → update the relevant Mermaid diagram.
- **New hook/util introduced** → add it to the parent directory `ARCHITECTURE.md` and create its own if the directory is new.
- **Type added/changed** → update `src/types/ARCHITECTURE.md`.
- **New dependency added** → update the Dependencies diagram in the affected `ARCHITECTURE.md`.
- **New naming/structural convention established** → update `src/components/PATTERNS.md` and the matching `.claude/rules/` file.
- **New architectural decision made** → add a new ADR to `docs/decisions/` following the ADR-NNN naming scheme, and add it to the ADR map in this file.
- **New artifact created or existing artifact enhanced/renamed** → update the relevant row in `src/INVENTORY.md`.

Documentation updates must be part of the **same commit** as the code change.

### Exploration Scratchpads

For multi-step exploration or investigation tasks, use the **`codebase-explorer` skill** — it owns the scratchpad (`findings.md`) and crash-recovery (`manifest.json`) procedure. Scratch files belong under `.tmp/exploration/` (gitignored), never at the repo root.

<!--VITE PLUS START-->

## Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run the quality gate (`vp fmt .`, `vp lint .`, `vp run lint:eslint:check`, `vp run lint:biome:check` from the root, `vp check`, `vp run typecheck`, `vp run test`) to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.
