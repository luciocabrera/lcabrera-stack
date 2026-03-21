# Project Instructions — vite-react-compiler

## 1. Project Overview

This is a **React 19 + TypeScript + StyleX + React Router 7** application with SSR support, built using the **Vite+** unified toolchain (`vp` CLI). It demonstrates enterprise-grade patterns including a feature-rich data Table component with custom store-based state management, virtualization, infinite scroll, and granular subscriptions via `useSyncExternalStore`.

### Tech Stack

- **Runtime:** React 19 (with React Compiler via `babel-plugin-react-compiler`)
- **Routing:** React Router 7 (with SSR, loaders, actions)
- **Styling:** StyleX (`@stylexjs/stylex`) — exclusive, no CSS modules, no styled-components
- **Toolchain:** Vite+ (`vp` CLI) wrapping Vite, Rolldown, Vitest, Oxlint, Oxfmt
- **Language:** TypeScript (strict mode)
- **Package Manager:** pnpm (managed through `vp`)

---

## 2. Source Structure

```
src/
├── components/          # Reusable UI components (Button, Card, Modal, Table, etc.)
│   └── Table/           # Enterprise data table with custom store architecture
│       ├── contexts/    # Split context providers (TableConfig, TableData, FiltersData)
│       ├── hooks/       # Table-specific hooks (resize, infinite scroll, persistence)
│       ├── filters/     # Filter UI components
│       └── [SubComponents]/  # Each sub-component in its own directory
├── constants/           # App-level constants (api.constants.ts, filterOperators.constants.ts)
├── contexts/            # App-level contexts (ThemeContext/)
├── design-system/       # Design tokens, themes, constants
│   ├── tokens/          # StyleX token definitions (base.stylex, colors.stylex)
│   ├── themes/          # Theme variants
│   └── constants/       # Design constants
├── hooks/               # Shared hooks (useStore, useVirtualization, useTheme, useClickOutside)
├── routes/              # React Router route modules (loaders, actions, components)
│   ├── home/
│   ├── car-sales/
│   ├── car-sales-infinite/
│   ├── enterprise-orders/
│   ├── settings/
│   └── api/             # API resource routes
├── services/            # External API integrations (carSales.api.ts, enterpriseOrders.api.ts)
├── types/               # Global type definitions
├── utils/               # Shared utilities (formatters, storage, URL state, performance)
├── root.tsx             # App root with providers
├── routes.ts            # Route configuration
└── entry.server.tsx     # SSR entry point
```

---

## 3. Toolchain — Vite+ (`vp`)

**Never use pnpm/npm/yarn directly.** All operations go through `vp`:

| Task                 | Command                                             |
| -------------------- | --------------------------------------------------- |
| Install dependencies | `vp install`                                        |
| Dev server           | `vp dev`                                            |
| Build for production | `vp build` (runs `react-router build`)              |
| Lint (with fix)      | `vp lint . --fix`                                   |
| Lint (check only)    | `vp lint .`                                         |
| Format               | `vp fmt .`                                          |
| Format check         | `vp fmt --check .`                                  |
| Type check           | `react-router typegen && tsc --noEmit`              |
| Run tests            | `node node_modules/.bin/vitest run`                 |
| Full validation      | `vp check` then `node node_modules/.bin/vitest run` |
| Add a package        | `vp add <package>`                                  |
| Remove a package     | `vp remove <package>`                               |

**Critical:** Import Vite config from `vite-plus`, not `vite`, for tooling integration. Example: `import { defineConfig } from 'vite-plus'`. For tests, import from `vitest`, e.g. `import { expect, test, vi } from 'vitest'`.

### Agent Checklist

- Run `vp install` after pulling changes and before starting work.
- **Always verify zero linting errors and zero TypeScript errors before considering any task complete.** Run `vp lint .` and `react-router typegen && tsc --noEmit` (or `vp check`) after every change.
- Run `vp check` and `node node_modules/.bin/vitest run` to validate all changes before finishing.

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

### Alphabetical Sorting (Mandatory Everywhere)

- **Destructured props** — alphabetical
- **JSX props** — alphabetical
- **Type/object keys** — alphabetical (`id` may come first as exception)
- **Import specifiers** — alphabetical
- Enforced by `eslint-plugin-perfectionist`

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
- **Never mutate props.** Use `[...array].sort()` or `useMemo` instead of `array.sort()`.
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
- **Shared UI state:** React Context with `use()` (React 19) — **never `useContext`**
- **No Redux.** Use Context or Zustand if global client state is needed.

---

## 9. React 19 Specific Patterns

### Mandatory Migrations

- **`use()` replaces `useContext()`** — `use()` can be called conditionally, supports Promises.
- **`useActionState`** for form actions with pending state.
- **`useFormStatus`** for submit button pending states from child components.
- **`useOptimistic`** for instant UI feedback during async operations.
- **`useTransition`** for non-urgent updates (search, filtering).

### Context Pattern

```typescript
import { use } from 'react';

const ThemeContext = createContext<Theme | undefined>(undefined);

export const useTheme = () => {
  const theme = use(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
};
```

---

## 10. Table Component Architecture

The Table is the project's most complex component. It uses a custom store-based state management pattern.

### Architecture Layers

```
Table.component.tsx (entry point)
├── TableConfigProvider (infrequent changes)
│   ├── columnsStore — column definitions, sorting, filters, visibility, sizing, order, pinning
│   └── metaStore — UI preferences (density, borders), pagination, persistence config
├── TableDataProvider (frequent changes)
│   ├── dataStore — table rows, loading states, pagination info
│   └── filtersDataStore — per-column filter dropdown data with async pagination
└── UI Components Layer
    └── Each component uses Actions (write) + Selectors (read)
```

### Store Pattern (`useSyncExternalStore`)

Foundation hook: `useStore.hook.ts` — shallow merge on `set()`, shallow equality checks, SSR-safe.

### Action/Selector Pattern

```
store/{domain}/
├── use{Domain}Store.hook.ts        # Base store hook
├── actions/                         # State mutations (useSet*, useReset*, useFetch*)
│   ├── useSetColumnFilter.hook.ts
│   └── index.ts
└── selectors/                       # State reads (useGet*)
    ├── useGetColumnFilters.hook.ts
    └── index.ts
```

- **Selectors:** stateless, return computed/direct values, enable granular subscriptions.
- **Actions:** encapsulate business logic, handle side effects (persistence, URL updates, async).
- **Component pattern:** import selectors for reads, import actions for writes, use action callbacks in event handlers.

### Store State Access Rule

**Never call `store.get()` more than once per action execution.** Capture the snapshot into a single variable, then read properties from it. Multiple `.get()` calls may return different snapshots if a concurrent update occurs between them, leading to inconsistent state.

```typescript
// ✅ Correct — single snapshot, multiple reads
const columnsState = columnsStore.get();
const columns = columnsState?.columns ?? [];
const columnsOrder =
  columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);
const currentPinning =
  columnsState?.columnPinning ??
  ({ left: [], right: [] } as ColumnPinningState<TData>);

// ❌ Forbidden — calling .get() multiple times
const columns = columnsStore.get()?.columns ?? [];
const columnsOrder =
  columnsStore.get()?.columnOrder ?? ([] as ColumnOrderState<TData>);
const currentPinning = columnsStore.get()?.columnPinning ?? {
  left: [],
  right: [],
};
```

This rule applies to every store: `columnsStore`, `dataStore`, `filtersDataStore`, `metaStore`.

### Key Features

- **Virtualization** (`useVirtualization.hook.ts`): Renders only visible rows.
- **Infinite Scroll** (`useInfiniteScroll.hook.ts`): Loads more data when scrolling near bottom.
- **Filter Dropdowns with Async Data**: Each column has its own filter data store entry with pagination.
- **State Persistence**: Actions persist to cookies/localStorage via `writeStateSlice()`.

---

## 11. Import Standards

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

1. **React & Core Libraries** (`react`, `react-router`)
2. **External Dependencies** (`@stylexjs/stylex`, `zod`)
3. **Internal Absolute Imports** (`@/features/...`, `@/components/...`)
4. **Relative Imports** (`./styles`, `../hooks`)
5. **Type Imports** (last, with `import type`)

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
- Import test utilities from `vite-plus/test` (not `vitest` directly).
- 80% minimum unit test coverage target.

---

## 15. Security

- Protect routes with authentication guards.
- Never commit secrets — use validated environment variables.

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
node node_modules/.bin/vitest run  # 4. unit/integration tests — all must pass
```

> **Note:** Use `node node_modules/.bin/vitest run` instead of `vp test` — `vp test` has a known OXC transform bug with `erasableSyntaxOnly: true` in tsconfig that causes all test suites to fail.

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
- **New artifact created or existing artifact enhanced/renamed** → update the relevant row in `src/INVENTORY.md`.

Documentation updates must be part of the **same commit** as the code change.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->
