# Project Instructions — vite-react-compiler

<!-- Audience: Claude, Gemini, and other non-GitHub agents — for GitHub Copilot see .github/copilot-instructions.md -->

This file provides guidance to AI agents when working with code in this repository. It contains the **universal, always-relevant** standards. Detailed per-file-type conventions live in `.claude/rules/` (see [Path-Specific Rules](#2-path-specific-rules)), and task workflows live in `.github/skills/`.

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
├── api/                 # Browser-safe API client — fetch, HTTP contracts, base-URL resolution
├── eslint-local-rules/  # Custom lint rules for this repo
├── node-runtime/        # Process-lifecycle primitives for long-running services (signals)
├── plugins/             # Shared Vite plugins
├── scan-ingestion/      # CQMS scan ingestion core + migrations
├── server/              # Node-only server code — Postgres (src/db), filters, crypto, tokens
├── ts-configs/          # Shared TypeScript configurations (generated — see its README)
├── ui/                  # Shared UI component library
├── utils/               # Shared utilities — pure and side-effect free (see its ARCHITECTURE.md)
└── vite-configs/        # Shared Vite config factories
```

That is **17 workspaces** — the count several rules below depend on. `packages/ui`,
`packages/api` and `packages/server` are becoming public packages and are
held strictest: never baseline, scope, or inline-disable a finding in any of them.

`api` and `server` split on **runtime**, and the split is load-bearing, not
cosmetic — the two names say which runtime each one is for, and the tsconfigs
enforce it in both directions. `@repo/api` is browser-safe: its tsconfig omits
`node` types, so a `process`/`fs` reach-in fails typecheck there. `@repo/server`
is Node-only (`pg`, `node:crypto`) and gets no DOM lib, so a `window`/`document`
reach-in fails there. They were one package until the cost showed up: `@repo/ui`
depended on the combined package for two fetch helpers and so pulled the Postgres
driver into every consumer's dependency graph. `packages/ui`'s `check:public-api`
now enforces the invariant — **a client-safe package may only depend on workspace
packages that are themselves client-safe** — so that regression fails the gate
instead of passing silently. The full topology and what each tsconfig denies is
[ADR-038](docs/cqms/decisions/ADR-038-public-package-topology-by-runtime.md),
which supersedes ADR-008.

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

| Rule file                           | Applies to                                                      | Contents                                                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/rules/typescript.md`       | `**/*.ts`, `**/*.tsx`                                           | Strict TS rules, `type` not `interface`, readonly, Args/Props/Result naming, file-name suffixes, FP/immutability, import alias                          |
| `.claude/rules/react-components.md` | `**/*.tsx`, `**/*.jsx`, `**/*.stylex.ts`                        | Component bundle structure, declaration/props naming, barrel files, React 19 mandatory rules, StyleX-only styling                                       |
| `.claude/rules/testing.md`          | `**/*.test.*`, `**/*.spec.*`                                    | Vitest/Testing Library conventions, `vp run test` usage, coverage target                                                                                |
| `.claude/rules/routes-data.md`      | `**/routes/**`, `**/services/**`, `**/*.api.ts`, config/entries | Loader/action data flow, zero `useEffect` fetching, store-pattern rule, error boundaries, Zod validation                                                |
| `.claude/rules/scripts.md`          | `**/*.mjs`, `**/*.cjs`, `**/scripts/**/*.js`                    | Build/tooling script standards — JSDoc "why" header, small pure functions, effects at edges, `node:` builtins, 350-line size ceiling (`scripts:verify`) |

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
| `commit-and-pr`               | Write commit messages + PR descriptions that pass the enforced standard (hook + CI gate)                    |

Selection guideline:

- **Working in complex UI state?** Start with `store-pattern`.
- **Finishing any code change?** Run `quality-gate-workflow`.
- **Committing or opening a PR?** Use `commit-and-pr`.
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

**The `.mjs`/`.cjs` scripts running these checks are themselves governed** — see
[`.claude/rules/scripts.md`](.claude/rules/scripts.md). This was a real blind spot:
the path-specific rules target TS/TSX, the eslint fan-out is per-workspace so it
never reaches root `scripts/`, and fallow's `maxUnitSize` is per-function — so
tooling scripts grew to 400–650 lines ungoverned. `vp run scripts:verify` (CI step
in `check-safe.yml`) caps code lines per file; inherited offenders are
grandfathered in `scripts/script-size-baseline.json` and may not grow (rebaseline
with `--write`, reviewed via the JSON diff). Correctness still comes from Oxlint +
Biome (repo-wide) and fallow (per-function complexity/dead-code).

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

**`vp check` type-checks, but it is not `tsc` — both run, and `typecheck:all` is the authority.** `vp check`'s type pass is **tsgolint** (Oxlint's type-aware path, enabled by `lint.options.typeCheck` in the root `vite.config.ts`), and it does resolve each workspace's own strict `tsconfig.app.json` — `strict`, `noUncheckedIndexedAccess` and `noUnusedLocals` all fire under it. What it does **not** do is run the per-workspace `typecheck` scripts, and those carry work no linter replicates: `packages/ui` gates its public API against server-only `node:*` imports (`check:public-api`), and both React Router apps regenerate route types first. Every one of the 17 workspaces now has a `typecheck` script, CI runs `vp run typecheck:all` as its own step in `check-safe.yml`, and `check:safe` chains it. Keep the two passes in sync: a new workspace gets a `typecheck` script **and** a tsconfig, or it silently falls back to the near-empty root `tsconfig.json` and is checked far more loosely than every other workspace (this is exactly how `utils`/`plugins`/`vite-configs` went un-strict for so long — `noUncheckedIndexedAccess` never fired there).

**tsconfigs are generated — never hand-edit them.** `packages/ts-configs/generate.ts` + `tsconfig.shared.ts` are the source of truth for every `tsconfig.app.json`/`tsconfig.node.json`; run `vp run --filter @repo/ts-configs generate` after changing either. A hand-edit survives exactly until the next unrelated regeneration silently reverts it — the `@repo/ui` bare-specifier alias in both apps was lost this way and had to be folded back into the generator. If a config needs something bespoke, add it to the generator entry, not to the JSON.

**Three linters run, and none of them is `vp check`.** Oxlint (`vp lint`) covers the whole tree from the root; the eslint pass (`vp run lint:eslint` / `lint:eslint:check`) exists in all 17 workspaces — React workspaces use `@repo/vite-configs/eslint-custom-rules`, node/library workspaces use `@repo/vite-configs/eslint-base-custom-rules` (same stack minus React/StyleX, and without `clean-import-paths`, which strips the import extensions node-resolution code requires). Inherited eslint violations are baselined per workspace in `eslint-suppressions.json` (ESLint bulk suppressions) — **new violations fail the gate**: CI runs `vp run -r lint:eslint:check` as its own step in `check-safe.yml`, because `vp check` covers only fmt + Oxlint + the tsgolint type pass and would let every eslint-only finding through. Burn debt down and shrink the baseline with `npx eslint . --config eslint.config.mjs --prune-suppressions`. Never add new entries by hand, and never inline-`// eslint-disable`/`oxlint-disable` a finding or switch the rule off in config — **verify, then fix the code instead** (see Non-Negotiable Rule 11). A lint finding is real until you've read the flagged code and confirmed otherwise; stylistic `unicorn/*` rules (e.g. `prefer-simple-condition-first`, `no-nested-ternary`) get fixed by restructuring, never silenced. **Exception: `packages/ui`, `packages/api` and `packages/server` are never silenced** — all three are public-facing, so every finding there gets fixed, never baselined or disabled. Each one's `eslint-suppressions.json` path is **gitignored** (`packages/ui/.gitignore`, `packages/api/.gitignore`, `packages/server/.gitignore`): ESLint's bulk-suppressions tooling — an editor extension, or `--prune-suppressions` run across every workspace — regenerates an empty `{}` for a workspace with nothing to suppress, and committing/deleting it was an endless loop. Because CI checks out no file, all three packages are suppression-free by construction and any real finding fails the gate. Never un-ignore any of them or commit a non-empty one.

**Biome is the third linter** (`vp run lint:biome:check`, CI step in `check-safe.yml` after the eslint pass, and a pre-commit `staged` entry in the root `vite.config.ts`). It is configured **once at the root** in `biome.jsonc` and runs one repo-wide pass — like Oxlint, unlike the per-workspace eslint fan-out. Do not add per-workspace `biome.jsonc` files or `lint:biome` scripts; `overrides` already scope per project. Full rationale — including why it is lint-only and why it is not a CQMS scanner — is in [ADR-035](docs/cqms/decisions/ADR-035-biome-third-linter.md). The rule set goes **beyond `recommended`**: a curated set of opt-in rules is enabled on top of the preset, added in approval-gated phases and measured per rule before landing — see [ADR-035 §7](docs/cqms/decisions/ADR-035-biome-third-linter.md). Overlap with Oxlint/eslint is kept as a deliberate safety net where the engines **agree**; only genuinely conflicting or noisy rules are dropped. Four constraints hold it in place:

- **Formatter and assist are OFF** (`formatter.enabled: false`, `assist.enabled: false`). Oxfmt owns formatting and eslint-perfectionist owns import order. Turning either on restarts the formatter/linter fight that the `eslint-suppressions.json` ignore rule already had to settle once.
- **Domains are scoped per project, not global.** The `react` domain is enabled in an `overrides` entry covering only the three React workspaces (`apps/react-router`, `apps/admin_system`, `packages/ui`) — enabling it globally would apply React rules to the Express/Fastify/node workspaces. `test` is scoped to test files; `project` runs repo-wide. Both add zero findings today and exist to guard future code.
- **`domains: { react: "recommended" }` does NOT enable every react rule** — this is the trap. `noNestedComponentDefinitions` and `noDuplicatedSpreadProps` are react-domain rules that fire only under `"all"` or when listed explicitly, so they are pinned by name at `error` in the same override (`noDuplicatedSpreadProps` also defaults to `warn`, which would not fail the gate). Verify any new rule with a deliberate violation before trusting a green run: a rule that is off reports the same clean pass as code that is correct.
- **Do not adopt `domains: { react: "all" }`.** It adds ~180 findings that contradict this repo's own ADRs — e.g. `noJsxPropsBind`/`noLeakedRender` vs ADR-004 (React Compiler owns memoization). (Individual react rules worth having are pinned by name instead: `useComponentExportOnlyModules` is enabled explicitly at `error` — off for test files — and is clean on every source file, ADR-007 barrels included.)
- **The config is `biome.jsonc`, not `biome.json`, and that is load-bearing.** Biome's config parser rejects `//` comments in a `.json` file — and it does not fail loudly: it **discards the entire config and silently falls back to defaults**, which lints `node_modules` and reports tens of thousands of findings (or, on a single file, a plausible-looking count with your `overrides` quietly not applied). Every rule scoped off here needs its reason next to it, so the file must stay `.jsonc`. If Biome ever starts reporting absurd counts or ignoring an override, suspect a config parse error first: `biome lint <file> 2>&1 | grep parse`.

Seven rules are scoped off in `overrides`, each with its reason inline — all seven are cases where Biome is wrong, not where the code is (`noThenProperty`, `useExhaustiveDependencies`, `noAriaHiddenOnFocusable`, `noNoninteractiveTabindex`, `useSemanticElements`, `noStaticElementInteractions`, `useComponentExportOnlyModules`). **ADR-035 §5 is the table** listing each with its justification; read it before adding an eighth, and match that bar. Four of the seven are Biome mismodelling an ARIA pattern the code implements correctly (window splitter, APG tabs panel, non-grid table row, conditional tooltip role); `useComponentExportOnlyModules` is off only for test files, where Fast Refresh never runs. Those seven are §5's "Biome is wrong for _this code_" cases and stay at seven; the phased hardening ([ADR-035 §7](docs/cqms/decisions/ADR-035-biome-third-linter.md)) adds a **separate** class of scope-off — whole rules turned off for a file _category_ where they don't apply, not for a mistaken finding: test-file exemptions (`noShadow`, `noEmptyBlockStatements`, `useUniqueElementIds` — idiomatic mock/fixture patterns) and framework/tooling exemptions (`noConsole` for scripts/CLIs/logger, `noDefaultExport` for routes/configs/entry/eslint-rules). Those are catalogued in §7, not counted among the seven.

**Prefer a rule option over a scope-off.** An option keeps the rule live everywhere else; a scope-off blinds it for a whole file. `noLabelWithoutControl` is the worked example: a `<label>` wrapping the `Checkbox` _component_ is correct HTML — Biome just cannot see through the component boundary — so `inputComponents: ["Checkbox"]` teaches it the name instead of disabling it, and a bare `<label>` with no control still fails. Add future input-rendering components to that list.

**Biome conflicts with eslint on how to return "nothing" from a `map` callback.** `useIterableCallbackReturn` demands a returned value, while `unicorn/no-null` bans `null` and `unicorn/no-useless-undefined` bans `undefined` — all three spellings fail one linter or the other. Restructure instead: `filter` the empty cases out before the `map`, so the callback always returns an element (`NotificationCenter.component.tsx` is the worked example). The same pairing bites nullish checks: `== undefined` trips Biome's `noDoubleEquals` and `== null` trips `unicorn/no-null`, so lean on arrays/objects always being truthy (`merge-arrays.util.ts`).

Rule 11 applies to Biome exactly as it does to the other two: no `// biome-ignore`, no rule-off to dodge a real finding, and nothing baselined in `packages/ui`.

**Lint JSON reports** follow the fallow output convention: `vp run lint:report` (script: `scripts/generate-lint-reports.mjs`, supports `--only=biome|eslint|oxlint`) regenerates `reports/oxlint/full-latest.json` (one repo-wide `vp lint . --format=json` run), `reports/eslint/full-latest.json` (the standard eslint `--format json` result array merged across all 17 workspaces, repo-relative paths), and `reports/biome/full-latest.json` (one repo-wide `biome lint . --reporter=json` run — root-only, mirroring the gate, since `biome.jsonc`'s `overrides` already scope the react domain and there is nothing to fan out). All three are tracked. ESLint runs in check mode — regenerating a report never mutates sources — and the baselined debt is visible per file in each entry's `suppressedMessages`, so the report is the place to inspect what the suppressions actually cover.

**SonarCloud findings** (`vp run sonar:report`, script `scripts/sonar-report.mjs`) follow the same convention: it pulls the project's open issues + security hotspots + quality-gate status from the SonarCloud **Web API** and writes the tracked `reports/sonar/full-latest.json`, so agents act on Sonar from a file like they do the lint/fallow reports — not the dashboard. This is necessary because SonarCloud runs here in **Automatic Analysis** mode: the GitHub App analyses each push server-side, there is no scanner step in the repo to read, and feature branches are analysed as **pull requests** (a `branch=<feature>` query 404s — pass `--pr <n>`; the tracked snapshot is `main`). Auth is a read-only `SONAR_TOKEN` loaded from a gitignored root `.env` or a CI secret — **never committed** (see `.env.example`); the script uses no `child_process` (an `execFile('git'|'gh', …)` would trip Sonar's own S4036 PATH hotspot). `vp run sonar:verify` (`--gate`) is the enforcement half: it exits non-zero when the quality gate is failing, a local mirror of the SonarCloud gate, and `--fail-on-issues` also fails on any open issue. **Two-layer enforcement is wired:** (1) SonarCloud's own **"SonarCloud Code Analysis" required check** (branch ruleset on `main`) gates on the "Sonar way" gate — rating-based, so it catches new bugs/vulns/hotspots/coverage/duplication but **not** new code smells (assigning a stricter custom gate is a paid SonarCloud feature). (2) The **`.github/workflows/sonar-issue-gate.yml`** job closes that gap for free — it runs `sonar-report.mjs --gate --fail-on-issues --wait` on every PR and fails on **any** open issue (the code smells layer 1 misses). `--wait` polls the Compute Engine (`api/ce/activity`) until the PR head commit's analysis has finished — Automatic Analysis is async and runs in parallel with CI, so a bare read races it; `--since` (the head commit time) is the freshness guard, and on timeout the job **skips** rather than blocks. Without a token (fork PRs) the script skips and the job stays green. To make layer 2 blocking, add the **"Strict Sonar issue gate"** check to the `main` ruleset's required checks after it has run once.

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

`vp run coverage:merge` (`scripts/merge-coverage.mjs`) runs `test:coverage` in the **DB-free** workspaces only (`server`, `node-runtime`, `scan-ingestion`, `ui`, `admin_system`, `scan-orchestrator`) and merges their reports. Coverage must never require Postgres: the first attempt at this lever was reverted (2026-07-14) because it ran scan-ingestion's `queries/*` suites in CI, where `getPool()` → `readEnvConfig()` throws on the missing `DB_*`. That is why `@repo/scan-ingestion` splits `test` (full, needs a DB) from `test:unit` / `test:coverage` (DB-free subset).

### Local Database Workflow (run from repo root)

Commands: [COMMANDS.md §4 → Database](COMMANDS.md#database). `vp run db:up` starts
local Postgres; seeding goes through `vp run --filter car-sales-api seed`, because
`seed`/`db:seed` are **api-server scripts, not root scripts**.

The API server (`apps/api-server/`) reads env from `docker/local/.env`. The frontend proxies `/api` to `http://localhost:3001`.

**Critical:** Import Vite config from `vite-plus`, not `vite`, for tooling integration. Example: `import { defineConfig } from 'vite-plus'`. For tests, import test utilities from `vitest` directly (e.g. `import { expect, test, vi } from 'vitest'`).

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
6. **Every function is pure by default; never mutate data or props** — functional array ops everywhere; side effects only in designated homes (action hooks, event handlers, providers/loaders, `*.service.ts`/`*.api.ts`). (`.claude/rules/typescript.md`)
7. **React Compiler handles memoization** — favor correct code over manual optimization (ADR-004). Table performance comes from granular selector subscriptions, row virtualization, and split contexts.
8. **Use `@/` alias for `src/`** — relative imports only within the same directory.
9. **No explicit return types on functions/hooks/components — let TypeScript infer** — annotate only when inference genuinely fails (recursion, overloads, complex conditional types) or must be widened. (`.claude/rules/typescript.md`)
10. **Never use workaround-only fixes** — always address and solve the underlying issue. If there is any doubt about intent, trade-offs, or risk, ask the user before applying a workaround or partial fix.
11. **Never ignore, suppress, or omit a lint finding — verify, then fix.** Oxlint/eslint violations (including stylistic `unicorn/*` rules like `prefer-simple-condition-first` / `no-nested-ternary`) are real until you have read the flagged code and confirmed otherwise. Do **not** dismiss one as a false positive without checking, and do **not** silence a new one — no inline `// eslint-disable`/`oxlint-disable`, no rule-off in config, no hand-added `eslint-suppressions.json` entry. Fix the code (reorder operands, restructure logic, wire up/delete the export). If it is a genuine false positive, explain why rather than disabling. `packages/ui`, `packages/api` and `packages/server` are held strictest — each one's `eslint-suppressions.json` is gitignored so none is ever committed and neither baselines (§4).
12. **Claim shared work before you touch it.** Multiple agents and humans work this repo in parallel. Before non-trivial work, register it in [`docs/coordination/`](docs/coordination/README.md): check for an area overlap, then create a task file (`tasks/_TEMPLATE.md`) with the `area` globs you own, branch, and keep `status`/`updated` current until it merges. Never edit files inside another active task's `area` without coordinating. The register — not `~/.claude/plans/` scratch, which is invisible to everyone else — is the shared record. `vp run coordination:verify` (CI) keeps it honest. (See "Multi-Agent Coordination" in §7.)
13. **Commits and PRs follow the enforced format.** Every commit message is a Conventional Commit (`type(scope): subject`) and every PR has a conforming title plus the required `## What` / `## Verification` sections — checked by the `commit-msg` git hook locally and the `pr-standards.yml` gate in CI. The one spec is `scripts/lib/commit-convention.mjs`; don't restate its type list elsewhere, and (Rule 11) fix a failing message/description rather than weakening the check. (See "Commit & PR Standards" in §7 and the `commit-and-pr` skill.)

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

### Multi-Agent Coordination

This repo is worked by multiple agents (Claude, Copilot, Gemini) and humans in
parallel, so **who is working on what** must be visible in git — not left in
per-agent scratch (`~/.claude/plans/`) or auto-memory, which no one else can see.
[`docs/coordination/`](docs/coordination/README.md) is that shared register.

This register is **in-flight** work only (who is touching what, right now). The
**durable backlog** — what should happen next, epics, milestones — lives in
**GitHub Issues / sub-issues / Milestones / Projects**; the boundary is
[ADR-036](docs/cqms/decisions/ADR-036-github-planning-layer.md) and the runbook is
[`docs/tooling/github-planning.md`](docs/tooling/github-planning.md). A task that
picks up a backlog item links it with the **required** `issue:` field —
`coordination:verify` fails a live task without a real issue reference, and
`vp run coordination:claim` creates/links the issue (and self-assigns it) for you.
The register is never moved to Issues — a task file is readable offline on any
branch and gated by `coordination:verify`; GitHub Issues are not.

**Before non-trivial work** (anything beyond a one-file fix you commit immediately):

1. **Check for collisions** — run `vp run coordination:verify`; it warns when your intended `area` overlaps an active task. Resolve overlaps (coordinate, or narrow scope) before starting. (`vp run coordination:board` writes a local, gitignored `BOARD.md` table view — never committed, [ADR-037](docs/cqms/decisions/ADR-037-coordination-board-is-a-local-view.md).)
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

- The component/hook/util directory being modified (e.g. `src/components/Table/ARCHITECTURE.md`)
- Parent directories if the change crosses boundaries (e.g. `src/hooks/ARCHITECTURE.md`)
- Shared type files (`src/types/ARCHITECTURE.md`) when filter or UI types are involved
- `src/components/PATTERNS.md` — always read this before creating or modifying any component; it defines naming conventions, StyleX composition order, the drawer-section pattern, filter contract, context+store pattern, and props-forwarding rules
- `docs/decisions/` — read the relevant ADR(s) before working in an area they cover: Modal → ADR-001, Tooltip → ADR-002, store → ADR-003, memoization/React Compiler → ADR-004, styling → ADR-005, infinite-scroll prefetch → ADR-006, barrel-export boundaries → ADR-007, primary-key sort tiebreaker / columns-derived id → ADR-008, filter-options fetch descriptors → ADR-009, cookie persistence via `/_action/persist-cookie` → ADR-010, grid interaction architecture (capability/command/surface) → ADR-011, column width → ADR-012

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
the `commit-and-pr` skill is the how-to. Two layers, so a mixed crew of agents and
humans follows it without exception:

- **Commit messages** are Conventional Commits — `type(scope): subject`. The
  `type` is one of the spec's `ALLOWED_TYPES`; the `scope` is preferably the
  workspace you touched (`ui`, `admin_system`, `api-server`, … — derived from
  `pnpm-workspace.yaml`, so it self-updates) or a cross-cutting area (`ci`,
  `docs`, `tooling`, …). An unrecognised scope only warns; a malformed header
  fails. The `.vite-hooks/commit-msg` hook (`commit:verify`) checks this on every
  commit; merge/revert/`fixup!` messages are skipped, and the `Co-Authored-By:`
  trailer is always accepted.
- **Pull requests** need a conforming title (same format) and a description with
  the required `## What` and `## Verification` (or `## Testing`) sections — fill in
  [`.github/pull_request_template.md`](.github/pull_request_template.md). CI's
  [`pr-standards.yml`](.github/workflows/pr-standards.yml) runs `pr:verify` on the
  title + body and `commit:verify` over every non-merge commit in the range, so
  nothing that skipped the local hook (`--no-verify`) reaches `main`.

**Do not restate the type list in prose** (this section, the skill, PR template) —
link to the spec so they cannot drift. If the standard itself must change, change
`commit-convention.mjs`; the hook, CI, template, and docs all follow from it.
(Non-Negotiable Rule 13.)

### Changelog & Labels

Two things fall out of the enforced commit convention, both reusing the same spec
so they never diverge from what the gate accepts:

- **Changelog** — [`CHANGELOG.md`](CHANGELOG.md) is **generated** (`vp run
changelog:generate`, `scripts/generate-changelog.mjs`): Conventional-Commit
  history grouped by version (git tags) then by type, each entry scope-labelled and
  linked, with breaking changes called out. Never hand-edit it —
  [`update-changelog.yml`](.github/workflows/update-changelog.yml) regenerates and
  commits it (`[skip ci]`) after every merge to `main`, via a bot commit that
  bypasses the ruleset and is itself excluded from the changelog (`':!CHANGELOG.md'`).
  On a `v*` tag, [`changelog.yml`](.github/workflows/changelog.yml) also publishes
  that release's section as the GitHub Release notes.
- **Labels** — a canonical `app:`/`pkg:`/`type:` + `breaking-change` taxonomy
  (`scripts/lib/labels.mjs`; the `app:`/`pkg:` set is derived from the workspaces,
  so it self-updates). [`sync-labels.yml`](.github/workflows/sync-labels.yml)
  creates/updates them on GitHub whenever `labels.mjs` or the workspace list changes
  on `main` (or on demand via `vp run labels:sync`), and
  [`labeler.yml`](.github/workflows/labeler.yml) applies them to every PR — scope
  from the changed workspaces (`scripts/pr-labels.mjs`), type from the PR title.
  Adding a workspace needs no manual step: the labeler **syncs the taxonomy from
  the PR head before applying**, so the new label exists on the PR that
  introduces it, not only after the merge. Do not remove that step — labels are
  created via the Issues API, which is also why that job needs `issues: write`.
  Note the sync workflow watches `apps/*/package.json` and
  `packages/*/package.json`, **not** just `pnpm-workspace.yaml`: that file holds
  only the globs, which a new workspace never edits, so watching it alone meant
  the workflow never fired for one.

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

From the repo root, `vp run typecheck:all` covers all 17 workspaces in dependency order, and `vp run check:safe` chains the whole gate the way CI does. While iterating, `vp run lint` in a workspace chains both lint autofixes (`vp lint . --fix` then `vp run lint:eslint`) and is the fastest loop.

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
