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
- **Every function is pure by default — purity is not a `*.util.ts`-only rule.** Same input → same output, no side effects, no mutation of arguments or captured state. This applies to all functions in all files: module-level helpers, derivations inside hooks/components, class methods, and inline callbacks. Side effects are allowed only in the designated homes listed under [Functional Programming & Immutability](#functional-programming--immutability).
- **Never write an explicit function/hook/component return type as a first approach — let TypeScript infer it.** Only add one when inference genuinely fails or produces the wrong type: recursive functions, complex conditional/mapped-type returns (see `Curry`/`Pipe` under Variadic Tuple Types below), overloaded signatures, or deliberately widening a literal/narrow inferred type. Do not add `: void`, `: string`, `: JSX.Element`, `: Promise<void>`, etc. out of habit — if you catch yourself typing a return annotation, delete it first and only restore it if `tsc`/inference actually needs it. (Some teaching examples later in this file annotate returns to make type mechanics visible — do not copy that habit into real code; type declarations and `declare`/interface signatures are not affected, since those have no body to infer from.)
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

**A `*.types.ts` / `*.constants.ts` file is named after the folder that owns it**
— `filters/filters.types.ts`, `crypto/crypto.constants.ts`,
`db/db.types.ts`, `errors/errors.constants.ts`. Everything in that folder belongs
to one domain, so its shared types and constants carry the domain's name, not a
description of their contents. A sub-domain gets its own folder and repeats the
pattern (`db/query-builder/query-builder.types.ts`).

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
- **Never mutate data.** Use spread syntax, `.map()`, `.filter()`, `.reduce()`.
- **Use functional array operations exclusively.** No imperative `for` loops for data transformations.
- **Never mutate props.** Use `array.toSorted()` instead of `array.sort()`.
- **`as const` for literal objects/arrays** where applicable.

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

## The satisfies Operator

Problem: Type Assertions Hide Bugs

```typescript
// Using 'as' can hide type errors
const config = {
  port: 3000,
  host: "localhost"
} as Record<string, string | number>;

// No error, but port is now string | number
const portString = config.port.toFixed(2); // Runtime error if port is string!
Solution: satisfies Validates Without Widening
// satisfies checks conformance but preserves literal types
const config = {
  port: 3000,
  host: "localhost"
} satisfies Record<string, string | number>;

// TypeScript knows port is number, host is string
config.port.toFixed(2);      // OK - port is number
config.host.toUpperCase();   // OK - host is string
Practical Use Cases
// Color palette with constrained values
const palette = {
  primary: "#007bff",
  secondary: "#6c757d",
  success: "#28a745"
} satisfies Record<string, `#${string}`>;

// TypeScript knows each property exists and is a hex string
palette.primary.startsWith("#"); // OK

// Route configuration
type RouteConfig = {
  path: string;
  method: "GET" | "POST";
  handler: () => void;
};

const routes = {
  home: { path: "/", method: "GET", handler: () => {} },
  login: { path: "/login", method: "POST", handler: () => {} }
} satisfies Record<string, RouteConfig>;

// TypeScript preserves literal types for each route
routes.home.method; // "GET" (not "GET" | "POST")
```

## Generic Fundamentals

### Basic Generic Function

```typescript
// Type parameter T can be any type
const identity = <T>(value: T): T => {
  return value;
};

const str = identity('hello'); // string
const num = identity(42); // number
const obj = identity({ x: 1 }); // { x: number }

// Explicit type argument (rarely needed)
const explicit = identity<string>('hello');
```

### Generic Interfaces

```typescript
type Container<T> = {
  value: T;
  getValue(): T;
  setValue(value: T): void;
};

type Repository<T, ID = string> = {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<boolean>;
};

// Implementation
class UserRepository implements Repository<User> {
  async findById(id: string): Promise<User | null> {
    // implementation
  }
  // ... other methods
}
```

### Generic Classes

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
const top = numberStack.pop(); // number | undefined
```

---

## Generic Constraints

### extends Constraint

```typescript
// T must have a length property
type HasLength = {
  length: number;
};

const logLength = <T extends HasLength>(item: T): T => {
  console.log(`Length: ${item.length}`);
  return item;
};

logLength('hello'); // OK: string has length
logLength([1, 2, 3]); // OK: array has length
logLength({ length: 10 }); // OK: object has length
logLength(42); // Error: number has no length
```

### keyof Constraint

```typescript
const getProperty = <T, K extends keyof T>(obj: T, key: K): T[K] => {
  return obj[key];
};

type Person = {
  name: string;
  age: number;
};

const person: Person = { name: 'Alice', age: 30 };

const name = getProperty(person, 'name'); // string
const age = getProperty(person, 'age'); // number
const bad = getProperty(person, 'email'); // Error: "email" not in Person
```

### Default Type Parameters

```typescript
type ApiResponse<T = unknown, E = Error> = {
  data?: T;
  error?: E;
  status: number;
};

// Uses defaults
const response1: ApiResponse = { status: 200 };

// Override data type only
const response2: ApiResponse<User> = { data: user, status: 200 };

// Override both
const response3: ApiResponse<User, ValidationError> = {
  error: new ValidationError(),
  status: 400,
};
```

---

## Mapped Types

### Basic Mapped Types

```typescript
// Transform all properties to optional
type Partial<T> = {
  [K in keyof T]?: T[K];
};

// Transform all properties to required
type Required<T> = {
  [K in keyof T]-?: T[K];
};

// Transform all properties to readonly
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Remove readonly modifier
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};
```

### Practical Mapped Types

```typescript
// Make all properties nullable
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// Make all properties async getters
type AsyncGetters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => Promise<T[K]>;
};

type User = {
  name: string;
  email: string;
};

type UserGetters = AsyncGetters<User>;
// {
//   getName: () => Promise<string>;
//   getEmail: () => Promise<string>;
// }
```

### Key Remapping (as clause)

```typescript
// Filter keys by type
type FilterByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

type Mixed = {
  name: string;
  age: number;
  active: boolean;
  score: number;
};

type StringProps = FilterByType<Mixed, string>;
// { name: string }

type NumberProps = FilterByType<Mixed, number>;
// { age: number; score: number }

// Prefix all keys
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K];
};

type PrefixedUser = Prefixed<User, 'user'>;
// { userName: string; userEmail: string }
```

---

## Conditional Types

### Basic Conditional Types

```typescript
// T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
type C = IsString<'hello'>; // true

// Practical: Extract non-nullable type
type NonNullable<T> = T extends null | undefined ? never : T;

type D = NonNullable<string | null>; // string
type E = NonNullable<number | undefined>; // number
```

### Distributive Conditional Types

```typescript
// Conditional types distribute over unions
type ToArray<T> = T extends unknown ? T[] : never;

type StringOrNumberArray = ToArray<string | number>;
// string[] | number[] (not (string | number)[])

// Prevent distribution with tuple
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;

type Mixed = ToArrayNonDist<string | number>;
// (string | number)[]
```

### infer Keyword

```typescript
// Extract return type
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type FnReturn = ReturnType<() => string>; // string

// Extract array element type
type ArrayElement<T> = T extends (infer E)[] ? E : never;

type Element = ArrayElement<number[]>; // number

// Extract Promise result
type Awaited<T> = T extends Promise<infer R> ? Awaited<R> : T;

type Result = Awaited<Promise<Promise<string>>>; // string

// Extract function first parameter
type FirstParam<T> = T extends (first: infer F, ...rest: any[]) => any
  ? F
  : never;

type First = FirstParam<(name: string, age: number) => void>; // string
```

### Practical Conditional Types

```typescript
// API response helper
type ApiResult<T> =
  { success: true; data: T } | { success: false; error: string };

// Extract data type from result
type ExtractData<T> = T extends { success: true; data: infer D } ? D : never;

type UserResult = ApiResult<User>;
type UserData = ExtractData<UserResult>; // User

// Type-safe event handlers
type EventHandler<T> = T extends `on${infer Event}`
  ? (event: Event) => void
  : never;

type ClickHandler = EventHandler<'onClick'>; // (event: "Click") => void
```

---

## Template Literal Types

### Basic Template Literals

```typescript
type Greeting = `Hello, ${string}!`;

const valid: Greeting = 'Hello, World!'; // OK
const invalid: Greeting = 'Hi, World!'; // Error

// Combine with unions
type Size = 'small' | 'medium' | 'large';
type Color = 'red' | 'blue' | 'green';

type ColoredSize = `${Color}-${Size}`;
// "red-small" | "red-medium" | "red-large" |
// "blue-small" | "blue-medium" | "blue-large" |
// "green-small" | "green-medium" | "green-large"
```

### String Manipulation Types

```typescript
// Built-in string manipulation types
type Upper = Uppercase<'hello'>; // "HELLO"
type Lower = Lowercase<'HELLO'>; // "hello"
type Cap = Capitalize<'hello'>; // "Hello"
type Uncap = Uncapitalize<'Hello'>; // "hello"

// Practical: Generate event names
type Event = 'click' | 'hover' | 'focus';
type EventHandler = `on${Capitalize<Event>}`;
// "onClick" | "onHover" | "onFocus"

// CSS property with vendor prefixes
type CSSProp = 'transform' | 'transition';
type Prefixed = `-webkit-${CSSProp}` | `-moz-${CSSProp}` | CSSProp;
```

### Advanced Template Patterns

```typescript
// Parse dot-notation paths
type PathSegment<T> = T extends `${infer Head}.${infer Tail}`
  ? Head | PathSegment<Tail>
  : T;

type Segments = PathSegment<'user.profile.name'>;
// "user" | "profile" | "name"

// HTTP methods with paths
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Endpoint = '/users' | '/posts' | '/comments';

type Route = `${Method} ${Endpoint}`;
// "GET /users" | "GET /posts" | "GET /comments" |
// "POST /users" | ... etc

// Type-safe SQL column references
type Table = 'users' | 'posts';
type Column<T extends Table> = T extends 'users'
  ? 'id' | 'name' | 'email'
  : T extends 'posts'
    ? 'id' | 'title' | 'content'
    : never;

type UserColumn = `users.${Column<'users'>}`;
// "users.id" | "users.name" | "users.email"
```

---

## Variadic Tuple Types

### Basic Variadic Tuples

```typescript
// Spread tuple types
type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U];

type Combined = Concat<[1, 2], [3, 4]>;
// [1, 2, 3, 4]

// Prepend element
type Prepend<T, U extends unknown[]> = [T, ...U];

type WithFirst = Prepend<0, [1, 2, 3]>;
// [0, 1, 2, 3]

// Append element
type Append<T extends unknown[], U> = [...T, U];

type WithLast = Append<[1, 2, 3], 4>;
// [1, 2, 3, 4]
```

### Practical Variadic Patterns

```typescript
// Typed curry function
type Curry<F> = F extends (...args: infer A) => infer R
  ? A extends [infer First, ...infer Rest]
    ? (arg: First) => Curry<(...args: Rest) => R>
    : R
  : never;

declare function curry<F extends (...args: any[]) => any>(fn: F): Curry<F>;

function add(a: number, b: number, c: number): number {
  return a + b + c;
}

const curriedAdd = curry(add);
const add1 = curriedAdd(1); // (arg: number) => Curry<...>
const add1and2 = add1(2); // (arg: number) => number
const result = add1and2(3); // number (6)

// Typed pipe function
type Pipe<T extends unknown[], R> = T extends [infer First, ...infer Rest]
  ? First extends (arg: R) => infer Next
    ? Pipe<Rest, Next>
    : never
  : R;

function pipe<T extends ((arg: any) => any)[]>(
  ...fns: T
): (arg: Parameters<T[0]>[0]) => Pipe<T, Parameters<T[0]>[0]> {
  return (arg) => fns.reduce((acc, fn) => fn(acc), arg);
}

const process = pipe(
  (n: number) => n * 2,
  (n: number) => n.toString(),
  (s: string) => s.length,
);

const length = process(5); // number (2 - length of "10")
```

---

## Built-in Utility Types Reference

| Utility                    | Purpose                 | Example                              |
| -------------------------- | ----------------------- | ------------------------------------ |
| `Partial<T>`               | All properties optional | `Partial<User>`                      |
| `Required<T>`              | All properties required | `Required<Partial<User>>`            |
| `Readonly<T>`              | All properties readonly | `Readonly<User>`                     |
| `Pick<T, K>`               | Select properties       | `Pick<User, "id" \| "name">`         |
| `Omit<T, K>`               | Exclude properties      | `Omit<User, "password">`             |
| `Record<K, V>`             | Create object type      | `Record<string, User>`               |
| `Exclude<T, U>`            | Remove union members    | `Exclude<"a" \| "b", "a">`           |
| `Extract<T, U>`            | Keep union members      | `Extract<"a" \| "b", "a">`           |
| `NonNullable<T>`           | Remove null/undefined   | `NonNullable<string \| null>`        |
| `Parameters<F>`            | Function parameters     | `Parameters<typeof fn>`              |
| `ReturnType<F>`            | Function return         | `ReturnType<typeof fn>`              |
| `ConstructorParameters<C>` | Constructor params      | `ConstructorParameters<typeof Date>` |
| `InstanceType<C>`          | Instance type           | `InstanceType<typeof Date>`          |
| `Awaited<T>`               | Unwrap Promise          | `Awaited<Promise<User>>`             |
| `NoInfer<T>`               | Prevent inference       | `NoInfer<T>` (TS 5.4+)               |
