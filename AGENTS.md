# Project Instructions — vite-react-compiler

<!-- Audience: Claude, Gemini, and other non-GitHub agents — for GitHub Copilot see .github/copilot-instructions.md -->

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
├── eslint-local-rules/  # Custom ESLint rules for this repo
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

## Quick Skill Index

Use these skills as the first stop for implementation patterns and workflows:

| Skill                         | Use For                                                                                        | Location                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `store-pattern`               | Table-style split-context external store architecture with selector/action boundaries          | `.github/skills/store-pattern/SKILL.md`               |
| `quality-gate-workflow`       | Mandatory post-change validation workflow (`vp lint --fix` → `vp check --fix` → `vp run test`) | `.github/skills/quality-gate-workflow/SKILL.md`       |
| `react-19`                    | React 19 component and compiler-safe patterns                                                  | `.github/skills/react-19/SKILL.md`                    |
| `react-router-framework-mode` | React Router framework mode data, actions, forms, navigation, error handling                   | `.github/skills/react-router-framework-mode/SKILL.md` |
| `code-smell-checker`          | Baseline maintainability audits and tech-debt triage                                           | `.github/skills/code-smell-checker/SKILL.md`          |
| `code-smell-zen`              | Diff-based smell review against target branch                                                  | `.github/skills/code-smell-zen/SKILL.md`              |
| `fallow-code-checker`         | Full fallow static hygiene scan with prioritized report (`vp run fallow:full`)                 | `.github/skills/fallow-code-checker/SKILL.md`         |
| `config-audit`                | Run claudelint, triage against known exceptions, produce fix plan for genuine issues           | `.github/skills/config-audit/SKILL.md`                |

Selection guideline:

- **Working in complex UI state?** Start with `store-pattern`.
- **Finishing any code change?** Run `quality-gate-workflow`.
- **Routing/data mutations?** Use `react-router-framework-mode`.
- **React component implementation?** Use `react-19`.

---

## 2. Source Structure

```
apps/react-router/src/
├── components/          # Reusable UI components (Button, Card, Modal, Table, etc.)
│   ├── Table/           # Enterprise data table with custom store architecture
│   │   ├── contexts/    # Split context providers (TableConfig, TableData, FiltersData)
│   │   ├── hooks/       # Table-specific hooks (resize, infinite scroll, persistence)
│   │   ├── filters/     # Filter UI components
│   │   └── [SubComponents]/  # Each sub-component in its own directory
│   ├── NotificationCenter/  # Global notification viewport (uses NotificationContext)
│   └── PATTERNS.md      # Naming conventions, StyleX order, drawer-section pattern
├── constants/           # App-level constants (api.constants.ts, filterOperators.constants.ts)
├── contexts/            # App-level contexts
│   ├── GlobalSettingsContext/  # Global user preferences (pin side, nav size) — persisted to cookie
│   ├── NotificationContext/    # In-memory notification store with auto-dismiss timers
│   └── ThemeContext/           # Light/dark theme preference
├── design-system/       # Design tokens, themes, constants
│   ├── tokens/          # StyleX token definitions (base.stylex, colors.stylex)
│   ├── themes/          # Theme variants
│   └── constants/       # Design constants
├── features/            # Route-isolated feature modules (e.g. showcase/)
├── hooks/               # Shared hooks (useStore, useVirtualization, useColumnVirtualization, useTheme, useClickOutside)
├── routes/              # React Router route modules (loaders, actions, components)
│   ├── home/
│   ├── car-sales/
│   ├── car-sales-infinite/
│   ├── enterprise-orders/
│   ├── settings/
│   └── api/             # API resource routes (/_action/persist-cookie, etc.)
├── services/            # External API integrations (carSales.api.ts, enterpriseOrders.api.ts)
├── types/               # Global type definitions
├── utils/               # Shared utilities (formatters, storage, URL state, performance)
├── INVENTORY.md         # Artifact catalog — consult before creating anything new
├── root.tsx             # App root with providers
├── routes.ts            # Route configuration
└── entry.server.tsx     # SSR entry point
```

---

## 3. Toolchain — Vite+ (`vp`)

**Never use pnpm/npm/yarn directly.** All operations go through `vp`:

| Task                 | Command                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| Install dependencies | `vp install`                                                                 |
| Dev server           | `vp dev`                                                                     |
| Build for production | `vp run build` (runs `react-router build` and emits `build/server/index.js`) |
| Lint (with fix)      | `vp lint . --fix`                                                            |
| Lint (check only)    | `vp lint .`                                                                  |
| Format               | `vp fmt .`                                                                   |
| Format check         | `vp fmt --check .`                                                           |
| Type check           | `react-router typegen && tsc --noEmit`                                       |
| Run tests            | `vp run test`                                                                |
| Full validation      | `vp lint . --fix && vp check --fix && vp run test`                           |
| Add a package        | `vp add <package>`                                                           |
| Remove a package     | `vp remove <package>`                                                        |

### Monorepo-Wide Commands (run from repo root)

| Task                       | Command            |
| -------------------------- | ------------------ |
| Verify everything is ready | `vp run ready`     |
| Run all tests recursively  | `vp run test -r`   |
| Build all apps             | `vp run build:all` |
| Start dev servers          | `vp run dev`       |

### Local Database Workflow (run from repo root)

| Task                     | Command            |
| ------------------------ | ------------------ |
| Start local PostgreSQL   | `vp run db:up`     |
| Check DB status          | `vp run db:status` |
| Seed data                | `vp run seed`      |
| Start + seed in one step | `vp run db:seed`   |
| Stop local PostgreSQL    | `vp run db:down`   |

The API server (`apps/api-server/`) reads env from `docker/local/.env`. The frontend proxies `/api` to `http://localhost:3001`.

**Critical:** Import Vite config from `vite-plus`, not `vite`, for tooling integration. Example: `import { defineConfig } from 'vite-plus'`. For tests, import test utilities from `vitest` directly (e.g. `import { expect, test, vi } from 'vitest'`).

### Agent Checklist

- Run `vp install` after pulling changes and before starting work.
- **Always verify zero linting errors and zero TypeScript errors before considering any task complete.** Run `vp lint .` and `react-router typegen && tsc --noEmit` (or `vp check`) after every change.
- Run `vp check` and `vp run test` to validate all changes before finishing.

---

## 4. TypeScript Standards

### Strict Configuration

The project enforces `strict: true` with additional flags: `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `noUnusedLocals`, `noUnusedParameters`.

### Mandatory Rules

- **Always use `type`, never `interface`** — prevents declaration merging, supports unions/intersections.
- **All type properties must be `readonly`** — enforces immutability at the type level.
- **Use `readonly T[]` for arrays in types** — prevents accidental mutation. Never use `ReadonlyArray<T>` (the `readonly T[]` shorthand is preferred throughout this codebase).
- **Never use `any`** — use `unknown` with type guards instead.
- **Never use `React.FC`** — use explicit arrow functions with typed props.
- **For `eslint-plugin-unicorn(no-nested-ternary)` violations, rewrite logic using `if/else` or early returns** — do not "fix" by adding parentheses around nested ternaries, because formatter/lint cycles may remove them and re-trigger the error.

### Function Parameters

- **2+ params or likely-to-grow functions → use object parameters** with an `Args` suffix type.
- **Single primitive/complex param → direct typing is acceptable.**
- **Hook signatures should use readonly argument objects** (for `*Args` hook parameter types). Keep callback parameter types compatible with callers (for example React state setters) and avoid over-constraining callback inputs when it breaks assignability.

```typescript
// ✅ Object params with Args suffix
type FormatCurrencyArgs = {
  readonly amount: number;
  readonly currency: string;
};
export const formatCurrency = ({ amount, currency }: FormatCurrencyArgs): string => { ... };

// ✅ Single param
export const formatDate = (date: Date): string => { ... };
```

### Naming Conventions for Types

| Context         | Suffix              | Example              |
| --------------- | ------------------- | -------------------- |
| Function params | `Args`              | `CalculateTotalArgs` |
| Component props | `Props`             | `ButtonProps`        |
| Hook params     | `Args`              | `UseUserDataArgs`    |
| Return types    | `Result` / `Return` | `FetchUserResult`    |

### Discriminated Unions for State

```typescript
type FetchState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: Error };
```

### Branded Types for IDs

```typescript
type UserId = string & { readonly __brand: 'UserId' };
```

---

## 5. Component Standards

### Component File Structure (Bundle Pattern)

Every component gets its own directory:

```
ComponentName/
├── ComponentName.component.tsx           # Implementation
├── ComponentName.types.ts      # Type definitions
├── ComponentName.stylex.ts     # StyleX styles
├── ComponentName.test.tsx      # Tests (colocated)
└── index.ts                    # Barrel export (public API)
```

### File Naming Suffixes

| Type      | Pattern                      | Example                     |
| --------- | ---------------------------- | --------------------------- |
| Component | `*.component.tsx`            | `LoginButton.component.tsx` |
| Hook      | `*.hook.ts`                  | `useAuthStatus.hook.ts`     |
| Utility   | `*.util.ts`                  | `dateFormatter.util.ts`     |
| Service   | `*.service.ts` or `*.api.ts` | `userApi.service.ts`        |
| Style     | `*.stylex.ts`                | `Card.stylex.ts`            |
| Type      | `*.types.ts`                 | `Card.types.ts`             |
| Test      | `*.test.tsx`                 | `Card.test.tsx`             |
| Constant  | `*.constants.ts`             | `api.constants.ts`          |
| Schema    | `*.schema.ts`                | `user.schema.ts`            |

### Component Declaration

```typescript
type ButtonProps = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onClick: () => void;
};

export const Button = ({ disabled = false, label, onClick }: ButtonProps) => {
  return <button disabled={disabled} onClick={onClick}>{label}</button>;
};
```

### Barrel Files

Each directory exposes a controlled public API via `index.ts`. Use explicit named exports, never `export *`.

```typescript
export { Button } from './Button';
export type { ButtonProps } from './Button.types';
```

### Props Naming

| Type                | Pattern                | Example                       |
| ------------------- | ---------------------- | ----------------------------- |
| Event handler props | `on[Event]`            | `onClick`, `onSave`           |
| Internal handlers   | `handle[Event]`        | `handleClick`, `handleSubmit` |
| Boolean props       | `is/has/should[State]` | `isLoading`, `hasError`       |
| Render props        | `render[Thing]`        | `renderHeader`, `renderEmpty` |

### Composition Over Configuration

Prefer composition (children, slots) over props-driven configuration to avoid prop explosion.

---

## 6. Styling — StyleX Only

### Rules

- **All styling uses StyleX.** No inline styles, no CSS modules, no styled-components, no Tailwind.
- Styles live in `*.stylex.ts` files alongside their component.
- Use design system tokens from `@/design-system/tokens/` instead of hardcoded values.

### Pattern

```typescript
// Component.stylex.ts
import * as stylex from '@stylexjs/stylex';
import { spacing, borderRadius } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  base: { padding: spacing.md, borderRadius: borderRadius.md },
  primary: { backgroundColor: colors.brandPrimary },
  disabled: { opacity: 0.5, cursor: 'not-allowed' },
});

// Component.tsx
<button {...stylex.props(styles.base, variant === 'primary' && styles.primary)} />
```

### Forbidden

- `style={...}` (inline styles) — runtime cost, no type safety
- `onClick={() => handler()}` in JSX — creates new reference each render, breaks memoization
- CSS Modules, Styled Components, Tailwind — inconsistent with architecture

---

## 7. Functional Programming & Immutability

- **All `*.util.ts` functions must be pure** — same input → same output, no side effects.
- **Never mutate data.** Use spread syntax, `.map()`, `.filter()`, `.reduce()`.
- **Use functional array operations exclusively.** No imperative `for` loops for data transformations.
- **Never mutate props.** Use `[...array].sort()` instead of `array.sort()`.
- **`as const` for literal objects/arrays** where applicable.

---

## 8. Data Layer — React Router 7

### Data Fetching

**Zero `useEffect` for data fetching.** All server data flows through React Router loaders/actions.

- **Read operations:** `loader` functions → consumed via `useLoaderData<typeof loader>()`
- **Write operations:** `action` functions → triggered via `useFetcher` or `<Form>`

```typescript
// Route loader
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const data = await api.fetchData(params.id);
  return data;
};

// Component
const MyPage = () => {
  const data = useLoaderData<typeof loader>();
  return <div>{data.name}</div>;
};
```

### Client State

- **Local UI state:** `useState`, `useReducer`
- **Shared / complex UI state:** the store-pattern (split context + `useSyncExternalStore`) — the **only** allowed pattern; no Redux, no Zustand, no ad-hoc Context+useState trees. Invoke the `/store-pattern` skill before implementing.

---

## 9. React 19 Specific Patterns

Two mandatory rules apply project-wide:

- **Always `use()`, never `useContext()`** — `use()` is conditional-safe and supports Promises; `useContext` is forbidden in this codebase.
- **Single store snapshot per action** — call `store.get()` exactly once per execution, assign to a const, read all properties from it.

For full React 19 patterns (all hooks, compiler-safe patterns, form actions, optimistic UI), invoke the `/react-19` skill.

---

## 10. State Management — Store Pattern (Only Allowed Approach)

The **store-pattern** is the **only** approved pattern for shared/complex UI state in this project. No Redux, Zustand, Recoil, or ad-hoc Context+useState trees are permitted.

The Table component is the canonical implementation: a 3-tier split-context architecture (`TableConfigProvider` → `TableDataProvider` → UI layer) backed by `useSyncExternalStore`, with a strict Action/Selector boundary so components never reach into stores directly.

**Invoke the `/store-pattern` skill before touching any store, context, selector, or action.** It contains the mandatory reference files, implementation checklist, and architecture templates.

---

## 11. Import Standards

> **Tooling note:** Rules marked "(enforced by ESLint)" are auto-checked and auto-fixed by `vp lint --fix`. Code reviewers and AI agents must not flag these — they are caught before merge by the quality gate.

### Alias

Use `@/` as the root alias for `src/`. Relative imports only within the same directory.

```typescript
// ✅
import { Button } from '@/components/Button';
import { styles } from './Card.stylex';

// ❌
import { Button } from '../../../../components/Button';
```

### Import Order (enforced by ESLint)

---

## 12. Error Handling & Validation

- **Error Boundaries:** All route components must be wrapped in error boundaries using `useRouteError`.
- **Input Validation:** Use Zod schemas for runtime type safety (especially in loaders/actions).
- **Type Guards:** Use `is` return type for runtime type narrowing with `unknown` data.
- **Environment Variables:** Validate with Zod schema, never commit secrets.

---

## 13. Performance Guidelines

- React Compiler handles most memoization automatically — favor correct code over manual optimization.
- Table performance: granular subscriptions via selectors, row virtualization, split contexts to minimize re-render cascades.

---

## 14. Testing

- Tests colocated with components (`ComponentName.test.tsx`).
- Use `@testing-library/react` for component tests.
- Import test utilities from `vitest` (e.g. `import { expect, test, vi } from 'vitest'`).
- Run a single test file: `vp run test -- --reporter=verbose <path/to/file.test.tsx>`
- 80% minimum unit test coverage target.

---

## 15. Security

- Protect routes with authentication guards.
- Never commit secrets — use validated environment variables.
- Never commit sensitive data in logs or error messages.
- Never commit .env files or credentials.

---

## 16. Documentation

- JSDoc comments on all exported functions, types, and components.
- Each feature directory should have a README.
- Architecture docs live in `docs/` and component-level `ARCHITECTURE.md` files.

### Architecture-First Workflow

Before making **any** code change, read every `ARCHITECTURE.md` that covers the files you are about to touch. These files document intent, data flow, and constraints that are not always visible from the code alone.

**Where to look:**

- The component/hook/util directory being modified (e.g. `src/components/Table/ARCHITECTURE.md`)
- Parent directories if the change crosses boundaries (e.g. `src/hooks/ARCHITECTURE.md`)
- Shared type files (`src/types/ARCHITECTURE.md`) when filter or UI types are involved
- `src/components/PATTERNS.md` — always read this before creating or modifying any component; it defines naming conventions, StyleX composition order, the drawer-section pattern, filter contract, context+store pattern, and props-forwarding rules
- `docs/decisions/` — read the relevant ADR(s) before working in an area they cover (Modal → ADR-001, Tooltip → ADR-002, store → ADR-003, memoization → ADR-004, styling → ADR-005)

If no `ARCHITECTURE.md` exists yet for the area you are changing, create one **before** implementing.

### Reuse Before You Build

Before creating any new component, hook, utility, constant, or type, **consult `src/INVENTORY.md`** first.

**Rules:**

1. If an artifact already exists that covers the need — **use it**.
2. If an artifact almost covers the need but is too specific — **enhance it to be more generic** rather than creating a new one. Update its `ARCHITECTURE.md` row and `INVENTORY.md` description after.
3. Only create something new when nothing in the inventory is a reasonable fit.

**Examples of preferred enhancements over new artifacts:**

- A util that formats dates for one preset → add a `preset` parameter to make it general
- A hook that manages one store shape → make the shape generic with `<TState>`
- A component that only accepts `string[]` options → extend to accept `{ label, value }[]` as well (backward-compatible)

When in doubt: a codebase with 18 components and 25 utilities that each do one thing well is better than 40 components and 50 utilities with overlapping concerns.

### Post-Change Quality Gate

Run these steps **in order** after every code change:

```bash
vp fmt          # 1. auto-format (Oxfmt)
vp lint         # 2. lint (Oxlint) — fix all reported issues
vp check        # 3. TypeScript type-check — zero errors required
vp run test     # 4. unit/integration tests — all must pass
```

> **Note:** Use `vp run test` instead of `vp test` — this repo defines a custom Vite+ `test` task that runs `node node_modules/vitest/vitest.mjs run`, avoiding the `vp test` OXC transform bug with `erasableSyntaxOnly: true` in tsconfig.

If any step fails, fix the issue before proceeding to the next step.

### Documentation Update Rule

After the quality gate passes, update every `ARCHITECTURE.md` affected by the change:

- **Props added/removed** → update the Props table in the component's `ARCHITECTURE.md`.
- **Render flow changed** → update the relevant Mermaid diagram.
- **New hook/util introduced** → add it to the parent directory `ARCHITECTURE.md` and create its own if the directory is new.
- **Type added/changed** → update `src/types/ARCHITECTURE.md`.
- **New dependency added** → update the Dependencies diagram in the affected `ARCHITECTURE.md`.
- **New naming/structural convention established** → update `src/components/PATTERNS.md`.
- **New architectural decision made** → add a new ADR to `docs/decisions/` following the ADR-NNN naming scheme.
- **New artifact created or existing artifact enhanced/renamed** → update the relevant row in `src/INVENTORY.md`.

Documentation updates must be part of the **same commit** as the code change.

<!--VITE PLUS START-->

## Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

## Context Management: Scratchpads & Crash Recovery

These rules apply to any multi-step exploration, research, or codebase
investigation task (not simple, single-file edits).

### Scratchpad (findings.md)

- Before starting any exploration task, create `findings.md` in the
  working directory if it does not already exist.
- As you discover relevant classes, functions, file paths, or dependency
  relationships, append them to `findings.md` immediately — full path,
  one-line description. Do not wait until the end of the task.
- Before each new search or file read, check `findings.md` first for
  anything already discovered. Do not re-derive information you have
  already recorded.
- Treat `findings.md` as your source of truth for specifics. Do not rely
  on the conversation history to recall exact names or paths.

### Manifest & Crash Recovery (manifest.json)

- Before starting any work, check whether `manifest.json` exists in the
  working directory.
  - If it exists, read it first. It contains `explored_paths`,
    `key_findings`, and `next_steps` from a previous session. Resume
    from `next_steps` rather than re-exploring `explored_paths`.
  - If it does not exist, create it now with empty fields.
- After completing each significant step (finishing a module, tracing a
  dependency chain, completing a subagent task), update `manifest.json`
  with any new paths explored, new findings, and a revised `next_steps`
  list.
- Keep the manifest current at all times. It is your persistent memory
  of progress, independent of this conversation, and must survive a
  crash or session restart.
