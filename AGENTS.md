# Project Instructions — vite-react-compiler

<!-- Audience: Claude, Gemini, and other non-GitHub agents — for GitHub Copilot see .github/copilot-instructions.md -->

This file provides guidance to AI agents when working with code in this repository. It contains the **universal, always-relevant** standards. Detailed per-file-type conventions live in `.claude/rules/` (see [Path-Specific Rules](#path-specific-rules)), and task workflows live in `.github/skills/`.

## 1. Project Overview

This is a **pnpm monorepo** built with the **Vite+** unified toolchain (`vp` CLI). The primary app is a **React 19 + TypeScript + StyleX + React Router 7** application with SSR support (`apps/react-router/`). It demonstrates enterprise-grade patterns including a feature-rich data Table component with custom store-based state management, virtualization, infinite scroll, and granular subscriptions via `useSyncExternalStore`.

### Monorepo Layout

```
apps/
├── react-router/     # Main SSR frontend app (React 19 + StyleX + React Router 7)
├── admin_system/     # Separate React Router SSR admin app
├── api-server/       # Express + PostgreSQL REST API (port 3001)
├── api-server-fast/  # Fastify alternative API server
└── shared/           # Shared code between apps
packages/
├── eslint-local-rules/  # Custom lint rules for this repo
├── plugins/             # Shared Vite plugins
├── ts-configs/          # Shared TypeScript configurations
├── utils/               # Shared utilities
└── vite-configs/        # Shared Vite config factories
```

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
| `config-audit`                | Run claudelint, triage against known exceptions, produce fix plan for genuine issues                        |

Selection guideline:

- **Working in complex UI state?** Start with `store-pattern`.
- **Finishing any code change?** Run `quality-gate-workflow`.
- **Routing/data mutations?** Use `react-router-framework-mode`.
- **React component implementation?** Use `react-19`.
- **Understanding unfamiliar code before changing it?** Use `codebase-explorer`.

---

## 4. Toolchain — Vite+ (`vp`)

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
| Type check           | `react-router typegen && tsc --noEmit` (or `vp check`)                                 |
| Run tests            | `vp run test` (never `vp test` — see the `quality-gate-workflow` skill)                |
| Full validation      | The canonical quality gate — see [Post-Change Quality Gate](#post-change-quality-gate) |
| Add a package        | `vp add <package>`                                                                     |
| Remove a package     | `vp remove <package>`                                                                  |

### Monorepo-Wide Commands (run from repo root)

Root scripts are **orchestration only** — anything project-specific lives in that project's own package.json. The `<task>:all` family fans out recursively in workspace dependency order.

| Task                                     | Command                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| Verify everything is ready               | `vp run ready`                                         |
| Run all tests (every workspace)          | `vp run test:all`                                      |
| Build all workspaces                     | `vp run build:all`                                     |
| Lint everything WITH fix (oxlint+eslint) | `vp run lint:all`                                      |
| Regenerate lint JSON reports             | `vp run lint:report`                                   |
| Merge coverage for the fallow gate       | `vp run coverage:merge`                                |
| Format everything                        | `vp run format:all`                                    |
| Typegen (both React Router apps)         | `vp run typegen:all`                                   |
| Full gate (typegen+check+tests)          | `vp run check:safe`                                    |
| Dev servers (frontend + express api)     | `vp run dev` (`dev:fast` = fastify, `dev:cqms` = CQMS) |
| Prod servers (frontend + express api)    | `vp run start` (`start:fast`, `start:cqms`)            |

There is deliberately **no `start:all`/`dev:all`**: `car-sales-api` and `car-sales-api-fast` are performance-comparison alternatives serving the same domain and must never run at the same time — always pick one combo.

**Both linters run in every workspace.** Oxlint (`vp lint`) covers the whole tree from the root; the eslint pass (`vp run lint:eslint` / `lint:eslint:check`) exists in all 15 workspaces — React workspaces use `@repo/vite-configs/eslint-custom-rules`, node/library workspaces use `@repo/vite-configs/eslint-base-custom-rules` (same stack minus React/StyleX, and without `clean-import-paths`, which strips the import extensions node-resolution code requires). Inherited eslint violations are baselined per workspace in `eslint-suppressions.json` (ESLint bulk suppressions) — **new violations fail the gate**; burn debt down and shrink the baseline with `npx eslint . --config eslint.config.mjs --prune-suppressions`. Never add new entries by hand, and never inline-`// eslint-disable`/`oxlint-disable` a finding or switch the rule off in config — **verify, then fix the code instead** (see Non-Negotiable Rule 11). A lint finding is real until you've read the flagged code and confirmed otherwise; stylistic `unicorn/*` rules (e.g. `prefer-simple-condition-first`, `no-nested-ternary`) get fixed by restructuring, never silenced. **Exception: `packages/ui` is never silenced** — it must not carry an `eslint-suppressions.json` at all; every finding there gets fixed, never baselined or disabled.

**Lint JSON reports** follow the fallow output convention: `vp run lint:report` (script: `scripts/generate-lint-reports.mjs`, supports `--only=eslint|oxlint`) regenerates `reports/oxlint/full-latest.json` (one repo-wide `vp lint . --format=json` run) and `reports/eslint/full-latest.json` (the standard eslint `--format json` result array merged across all 15 workspaces, repo-relative paths). Both are tracked. ESLint runs in check mode — regenerating a report never mutates sources — and the baselined debt is visible per file in each entry's `suppressedMessages`, so the report is the place to inspect what the suppressions actually cover.

Known constraint: `scan-orchestrator`'s queue integration test shares the local CQMS Postgres queue — while `vp run dev:cqms` is running, the live orchestrator races the test for queued scans and `vp run test:all` can flake on `runQueuedScan.test.ts` (duplicate `reports_scan_id_key`). Stop the CQMS dev session before a full test run, or treat that single failure as environmental.

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

| Task                                  | Command                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| Full scan (dead code, dupes, health)  | `vp run fallow:full`                                                         |
| Dead code only                        | `vp run fallow:dead-code`                                                    |
| Complexity/health report              | `vp run fallow:health`                                                       |
| Duplication report                    | `vp run fallow:dupes`                                                        |
| PR-style gate vs main (run before PR) | `vp run fallow:audit --base main`                                            |
| Refresh complexity threshold report   | `vp run fallow:refresh-report` (optionally `<workspace-glob>` and `--top=N`) |

CI runs `fallow audit --gate new-only` on every PR (`check-safe.yml`) — it fails only on newly-introduced dead code, complexity, or duplication; inherited debt is covered by baselines in `reports/fallow/baselines/`.

**Always feed the audit real coverage** (`--coverage reports/fallow/coverage/coverage-final.json`, produced by `vp run coverage:merge`; the CI job does this for you). Fallow scores CRAP as `cyclomatic² × (1 − coverage)³ + cyclomatic` against a threshold of **30**, and with no coverage data it _estimates_ coverage from whether a colocated test file merely exists (`none` → 0%, `partial` → 40%, `high` → 85%). At an estimated 0%, **every function with cyclomatic ≥ 5 breaches the threshold** — so an unfed audit reports trivially simple code (`login.action.ts`, cyclomatic 5 / cognitive 2) as `critical`. When triaging a complexity finding, read its **`exceeded`** field, not `severity`: `crap` alone means "untested", while `all`/`cognitive` means genuinely complex. `coverage_source: "mixed"` is expected — files with no tests at all have nothing to measure and still fall back to the estimate.

`vp run coverage:merge` (`scripts/merge-coverage.mjs`) runs `test:coverage` in the **DB-free** workspaces only and merges their reports. Coverage must never require Postgres: the first attempt at this lever was reverted (2026-07-14) because it ran scan-ingestion's `queries/*` suites in CI, where `getPool()` → `readEnvConfig()` throws on the missing `DB_*`. That is why `@repo/scan-ingestion` splits `test` (full, needs a DB) from `test:unit` / `test:coverage` (DB-free subset).

### Local Database Workflow (run from repo root)

| Task                     | Command                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| Start local PostgreSQL   | `vp run db:up`                                                       |
| Check DB status          | `vp run db:status`                                                   |
| Seed data                | `vp run --filter car-sales-api seed` (or `vp run seed` from the app) |
| Start + seed in one step | `vp run --filter car-sales-api db:seed`                              |
| Stop local PostgreSQL    | `vp run db:down`                                                     |

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
- `docs/decisions/` — read the relevant ADR(s) before working in an area they cover: Modal → ADR-001, Tooltip → ADR-002, store → ADR-003, memoization/React Compiler → ADR-004, styling → ADR-005, infinite-scroll prefetch → ADR-006, barrel-export boundaries → ADR-007, primary-key sort tiebreaker / columns-derived id → ADR-008, filter-options fetch descriptors → ADR-009

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
vp fmt .        # 1. auto-format (Oxfmt)
vp lint .       # 2. lint (Oxlint) — fix all reported issues (use --fix first)
vp check        # 3. TypeScript type-check — zero errors required
vp run test     # 4. unit/integration tests — all must pass (never `vp test`)
```

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
- [ ] Run the quality gate (`vp fmt .`, `vp lint .`, `vp check`, `vp run test`) to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.
