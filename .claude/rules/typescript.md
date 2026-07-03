---
paths: ['**/*.ts', '**/*.tsx']
---

# TypeScript Standards

## Strict Configuration

The project enforces `strict: true` with additional flags: `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `noUnusedLocals`, `noUnusedParameters`.

## Mandatory Rules

- **Always use `type`, never `interface`** — prevents declaration merging, supports unions/intersections.
- **All type properties must be `readonly`** — enforces immutability at the type level.
- **Use `readonly T[]` for arrays in types** — prevents accidental mutation. Never use `ReadonlyArray<T>` (the `readonly T[]` shorthand is preferred throughout this codebase).
- **Never use `any`** — use `unknown` with type guards instead.
- **Never use `React.FC`** — use explicit arrow functions with typed props.
- **For `unicorn(no-nested-ternary)` violations, rewrite logic using `if/else` or early returns** — do not "fix" by adding parentheses around nested ternaries, because formatter/lint cycles may remove them and re-trigger the error.

## Function Parameters

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

## Naming Conventions for Types

| Context         | Suffix              | Example              |
| --------------- | ------------------- | -------------------- |
| Function params | `Args`              | `CalculateTotalArgs` |
| Component props | `Props`             | `ButtonProps`        |
| Hook params     | `Args`              | `UseUserDataArgs`    |
| Return types    | `Result` / `Return` | `FetchUserResult`    |

## Discriminated Unions for State

```typescript
type FetchState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: Error };
```

## Branded Types for IDs

```typescript
type UserId = string & { readonly __brand: 'UserId' };
```

## File Naming Suffixes

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

## Functional Programming & Immutability

- **All `*.util.ts` functions must be pure** — same input → same output, no side effects.
- **Never mutate data.** Use spread syntax, `.map()`, `.filter()`, `.reduce()`.
- **Use functional array operations exclusively.** No imperative `for` loops for data transformations.
- **Never mutate props.** Use `[...array].sort()` instead of `array.sort()`.
- **`as const` for literal objects/arrays** where applicable.

## Import Standards

> **Tooling note:** Import order is enforced and auto-fixed by `vp lint . --fix` (Oxlint). Do not reorder imports manually, and do not flag import ordering in review — the quality gate catches it before merge.

Use `@/` as the root alias for `src/`. Relative imports only within the same directory.

```typescript
// ✅
import { Button } from '@/components/Button';
import { styles } from './Card.stylex';

// ❌
import { Button } from '../../../../components/Button';
```
