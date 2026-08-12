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
- **Prefer `satisfies` over `as` for literal objects** — `as` widens and hides the very
  errors it looks like it is checking (a `port: 3000` asserted `as Record<string, string | number>`
  silently becomes `string | number`); `satisfies` validates conformance while preserving
  the literal types.
- **Never use `React.FC`** — use explicit arrow functions with typed props.
- **Every function is pure by default — purity is not a `*.util.ts`-only rule.** Same input → same output, no side effects, no mutation of arguments or captured state. This applies to all functions in all files: module-level helpers, derivations inside hooks/components, class methods, and inline callbacks. Side effects are allowed only in the designated homes listed under [Functional Programming & Immutability](#functional-programming--immutability).
- **Never write an explicit function/hook/component return type as a first approach — let TypeScript infer it.** Only add one when inference genuinely fails or produces the wrong type: recursive functions, complex conditional/mapped-type returns (a recursive `Curry`/`Pipe` helper is the usual case), overloaded signatures, or deliberately widening a literal/narrow inferred type. Do not add `: void`, `: string`, `: JSX.Element`, `: Promise<void>`, etc. out of habit — if you catch yourself typing a return annotation, delete it first and only restore it if `tsc`/inference actually needs it. (Type declarations and `declare` signatures are not affected, since those have no body to infer from.)
- **For `unicorn(no-nested-ternary)` violations, rewrite logic using `if/else` or early returns** — do not "fix" by adding parentheses around nested ternaries, because formatter/lint cycles may remove them and re-trigger the error.

## Function Parameters

- **2+ params or likely-to-grow functions → use object parameters** with an `Args` suffix type.
- **Single primitive/complex param → direct typing is acceptable.**
- **Hook signatures should use readonly argument objects** (for `*Args` hook parameter types). Keep callback parameter types compatible with callers (for example React state setters) and avoid over-constraining callback inputs when it breaks assignability.

```typescript
// ✅ Object params with Args suffix — return type omitted, TypeScript infers it
type FormatCurrencyArgs = {
  readonly amount: number;
  readonly currency: string;
};
export const formatCurrency = ({ amount, currency }: FormatCurrencyArgs) => { ... };

// ✅ Single param — return type omitted, TypeScript infers it
export const formatDate = (date: Date) => { ... };
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
| Error     | `*.error.ts`                 | `persistence.error.ts`      |

**In a domain folder, `*.types.ts` / `*.constants.ts` is named after the folder**
— `filters/filters.types.ts`, `crypto/crypto.constants.ts`, `db/db.types.ts`,
`errors/errors.constants.ts`. A domain folder is one whose name _is_ the subject:
everything inside belongs to it, so the shared types and constants carry the
domain's name rather than a description of their contents, and there is exactly
one of each. A sub-domain gets its own folder and repeats the pattern
(`db/query-builder/query-builder.types.ts`). `packages/server`, `packages/api` and
`packages/utils` are built this way throughout, so a new file there follows it
without exception.

Two folder shapes are **not** domain folders and do not take the rule — check
which one you are in before renaming anything:

- **An artifact folder** — one holding a component, context or route module — names
  the file after the artifact, because the folder is a container for that one
  thing: `TableConfig/TableConfigContext.types.ts`,
  `project-detail/ProjectDetail.types.ts`, `trigger-scan/triggerScan.constants.ts`.
  `packages/ui/src/PATTERNS.md` owns that spelling.
- **A catch-all folder** — `types/`, `constants/`, `utils/` — names the file after
  its subject, because the folder names a _kind_, not a domain, and holds many:
  `types/theme.types.ts`, `constants/app.constants.ts`. `types/types.types.ts` is
  the reductio.

**The folder pairing is gate-enforced** by the
`local-rules/domain-folder-filename` ESLint rule (part of the `lint:eslint`
pass, live in every workspace). It tells the three shapes apart from the path
alone — a PascalCase folder is an artifact folder, everything under a `routes/`
tree is a route container, and the folder names in the rule's
`catchAllFolders` option are catch-alls — so a misnamed file in a domain folder
fails the build and "exactly one of each" follows from the naming, because two
files in one folder cannot both be `<folder>.constants.ts`. A route tree is
exempt outright, which is the rule's one blind spot: it cannot see that
`routes/car-sales-infinite/` holds a `CarSales` component without reading the
directory, and an ESLint rule in a public package may not do that.

**One error class per `*.error.ts` file**, same rule as `*.util.ts` — the class,
its `Args` type, and a colocated `*.error.test.ts`.

**The base-name CASE is gate-enforced** by the `local-rules/filename-convention`
ESLint rule (part of the `lint:eslint` pass) — a wrong-cased file fails the
build, so this is no longer prose-only. Enforced today:

- **Route modules** (`*.loader.ts` / `*.action.ts` / `*.clientAction.ts` /
  `*.meta.ts`) → **kebab-case** (e.g. `order-detail.loader.ts`, never
  `orderDetail.loader.ts`).
- **Components** — the view (`*.component.tsx`), its layout (`*.layout.tsx`),
  and its error boundary (`*.error-boundary.tsx`) → **PascalCase** base, named
  after the component (`EnterpriseOrders.error-boundary.tsx`). The old camelCase
  `*.errorBoundary.tsx` suffix is rejected in favour of the hyphenated
  `*.error-boundary.tsx`.
- **Hooks** (`*.hook.ts`) → **camelCase** with a `use` prefix.

Deliberately not yet enforced (each needs a convention decision, not a guess):
`*.service` / `*.api` / `*.schema` case. `*.util` **is** enforced — camelCase
everywhere, except `@lcabrera/utils`, whose eslint config passes the
`filename-convention` rule's `suffixCase: { util: 'kebab-case' }` option so its
kebab-case `.util` files are asserted (a camelCase one there fails the gate),
rather than turning the rule off.

## One Util Per File

- **Every utility function lives in its own `*.util.ts` file with a colocated `*.util.test.ts`** — never stack multiple module-level helper functions inside one util file, even "private" ones only used by the main export. Extract each helper to its own file with its own unit test (see `packages/ui/src/entry/`: `createHandleRequest.util.tsx` imports `toError.util.ts`, `buildShellStreamResponse.util.ts`, `addPreloadHeaders.util.ts`, each individually tested).
- Small closures that capture local state stay inline; anything expressible as a top-level function with explicit args gets its own file.

## Functional Programming & Immutability

- **Purity is the default for every function, everywhere** — same input → same output, no side effects, no mutation of arguments or captured state. Not just utils: module-level helpers, derivations inside hooks/components, class methods, and inline callbacks are all pure unless they are one of the designated side-effect homes below.
- **Side effects are confined to designated homes** — and nowhere else:
  - action hooks (store writes, persistence, URL/cookie sync, fetch orchestration)
  - event handlers inside components (`handle*`)
  - providers/context infrastructure, entry points, and route loaders/actions
  - service modules (`*.service.ts` / `*.api.ts`)
  - test setup/teardown
- **A function that needs a side effect must live in (or be called from) one of those homes.** Never bury a store write, a `fetch`, `Date.now()`/`Math.random()`, DOM access, or logging inside an otherwise-pure helper. Impure logic hiding in a helper gets split: the pure computation stays in the helper; the effect moves to the designated caller.
- **All `*.util.ts` functions must be pure, no exceptions** — a "util" that needs side effects is not a util; move it to an action hook or service and keep the pure computation behind it testable.
- **Never mutate anything you did not create in the current function** — arguments, props, captured/outer state, store state, or a value you already returned. Use spread syntax and the non-mutating array methods. This is what immutability is actually protecting; it is **not** a ban on writing to a local you just allocated (see [Choosing an array operation](#choosing-an-array-operation)).
- **Never mutate props.** Use `array.toSorted()` instead of `array.sort()`.
- **`as const` for literal objects/arrays** where applicable.

### Choosing an array operation

Pick by **what the code is doing**, not by which method sounds most functional. Every
option below is non-mutating from the caller's perspective.

| Intent                                                      | Use                                                          | Notes                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 1-to-1 transform                                            | `.map()`                                                     | Never `reduce` for this.                                                                                                |
| Selection only                                              | `.filter()`                                                  |                                                                                                                         |
| 1-to-many, or flattening a nested structure                 | `.flatMap()`                                                 | Its real purpose — see `flattenFields.util.ts`, `collectAccessors.util.ts`.                                             |
| Select **and** transform                                    | `.filter().map()`                                            | The readable default. Two passes, two allocations, and that is fine at this repo's sizes.                               |
| Same, on a **measured** hot path                            | `.reduce()` into a local accumulator                         | `acc.push(x); return acc` — **not** `[...acc, x]`, which Biome's `noAccumulatingSpread` rejects and which is quadratic. |
| Fold to a single scalar or object                           | `.reduce()`                                                  |                                                                                                                         |
| Early exit / short-circuit                                  | `.find()`, `.some()`, `.every()`, or `for...of` with `break` | Do not scan a whole array to answer a yes/no question.                                                                  |
| Several outputs in one traversal, or building a `Map`/`Set` | `for...of`                                                   | Clearer than a `reduce` threading a tuple or object accumulator.                                                        |
| Side effects over a collection                              | `for...of`                                                   | Never `.map()`/`.filter()` for effects, and never `.forEach()`.                                                         |

**A `reduce` accumulator you allocated yourself is not shared state.** Mutating it breaks
no caller, and it is the only shape `noAccumulatingSpread` leaves available. Keep the
mutation local: never `push` into an array that arrived as an argument or came from a
store.

**`for...of` is permitted for the rows above and is not a fallback to apologise for.**
What stays banned is a manual index loop re-implementing a plain `.map()`/`.filter()`, and
using any iteration construct to mutate data you do not own.

**Do not rewrite `.filter().map()` as `flatMap(x => cond ? [y] : [])` for speed.** It
reads as the single-pass optimization and is the opposite across the range this repo
actually handles: it allocates a throwaway array **per element** where the chain allocates
two in total, and it measured roughly **two times slower** than the chain up to the
hundred-thousand-element mark. It only pulls ahead at around a million elements with a
high keep rate, where the chain's two large intermediates finally cost more than the
per-element garbage — a size no UI path here reaches. Use `flatMap` when the mapping
genuinely yields zero-or-many elements, not as a fused `filter`+`map`.

**Prefer `.filter().map()` over `.map().filter()`** when both orders are correct — the
map then runs over the already-narrowed input. The gap grows as the filter gets more
selective, which is the common case.

**Reach for a single-pass shape on evidence, not instinct.** `.filter().map()` is the
default; fusing it buys a constant factor that is dwarfed by an unnecessary render or a
per-row recomputation. Every measured win in this codebase has come from deleting
redundant work or hoisting an invariant derivation, never from fusing two passes.

Run `node scripts/bench-array-operations.mjs` for the current numbers on your machine, and
read [ADR-054](../../docs/decisions/ADR-054-array-operation-hierarchy.md) for what the
ordering does and does not license. Do not quote a figure from either into new prose — the
ordering is the durable part.

## Import Standards

> **Tooling note:** Import order is enforced and auto-fixed by the **eslint** pass (`eslint-plugin-perfectionist`'s `sort-imports` / `sort-modules`), **not** by Oxlint. `vp lint . --fix` alone will not touch import order — Oxlint loads no `import/order` rule, and only pulls perfectionist into `*.stylex.ts` to switch two rules _off_. Run **`vp run lint`** in the workspace (it chains `vp lint . --fix` then `vp run lint:eslint`, which is `eslint --fix`), or `vp run lint:all` from the root. Do not reorder imports manually, and do not flag import ordering in review — the quality gate catches it before merge.

**In an app**, use `@/` as the root alias for `src/`. Relative imports only within the same directory.

```typescript
// ✅
import { Button } from '@/components/Button';
import { styles } from './Card.stylex';

// ❌
import { Button } from '../../../../components/Button';
```

**In a publishable package** (`packages/ui`, `api`, `server`, `utils`) use the
package's **own name** instead — `@lcabrera/ui/components/Button`. `@/` resolves only
through a tsconfig `paths` entry, so it cannot survive publication: a consumer
compiling our source has no such alias and the import fails to resolve. The
package's own name resolves via Node's self-reference through `exports`, which
works identically inside and outside this repo.

You do not have to remember which is which. The four publishable packages are
generated with `srcAlias: false` (`packages/ts-configs/generate.ts`), so they
have no `@/*` mapping at all and tsc rejects such an import outright. Do not add
the alias back to make one compile — rewrite the import.
