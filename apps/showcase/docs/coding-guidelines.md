This document consolidates all the previously discussed architectural, structural, and tooling standards into a single, cohesive **Markdown Coding Guideline** ready for team use.

---

# 🚀 Engineering Standards Document (React/StyleX/TS)

This document establishes the mandatory guidelines for writing modern, scalable, and maintainable applications using **React 19, StyleX, TypeScript, and React Router 7**.

## 1\. Architecture and File Structure

We follow a **Feature-Based Architecture** with a **Colocated "Bundle" Strategy** for components.

### 1.1 Feature Directory Structure

Features are grouped by domain logic. Logic, UI, and Data are clearly separated.

```markdown
src/
services/
authApi.service.ts # Data Layer: API calls, external dependencies
authLoader.ts # React Router Loader/Action logic
components/
LoginButton/ # Component Bundle Directory
├── LoginButton.tsx
├── LoginButton.styles.ts
├── LoginButton.types.ts
└── index.ts # Barrel file (Public API)
hooks/
useAuthStatus.hook.ts # Logic Layer: State, effects, derived data
```

### 1.2 Strict File Suffixes

Every file's purpose must be immediately clear from its name.

| Type        | Pattern        | Example                     |
| :---------- | :------------- | :-------------------------- |
| **Hook**    | `*.hook.ts`    | `useUserList.hook.ts`       |
| **Utility** | `*.util.ts`    | `currencyFormatter.util.ts` |
| **Service** | `*.service.ts` | `userApi.service.ts`        |
| **Style**   | `*.styles.ts`  | `Card.styles.ts`            |
| **Type**    | `*.types.ts`   | `Card.types.ts`             |
| **Index**   | `index.ts`     | Barrel file for export      |

### 1.3 Barrel Files (`index.ts`)

Use a hybrid boundary model:

- Inside a feature/module, prefer direct-file imports.
- Across feature/module boundaries, use a curated `index.ts` barrel as the public API.
- Avoid deep internal barrels that re-export all internals.

See decision record:
[`apps/showcase/docs/decisions/ADR-007-barrel-export-boundaries.md`](./decisions/ADR-007-barrel-export-boundaries.md)
— cited by path because two ADR homes exist, not because this number is in both.

```typescript
// src/components/Button/index.ts (public boundary)
export { Button } from './Button';
export type { ButtonProps } from './Button.types';
```

## 2\. TypeScript and Typing

### 2.1 Preference for `type`

Always use `type` aliases over `interface` for consistency, flexibility (unions/intersections), and to prevent unwanted declaration merging.

```typescript
// ✅ DO
export type User = { readonly id: string; readonly name: string };
// ❌ DON'T
export interface User {
  id: string;
  name: string;
}
```

### 2.2 Strict Typing & Immutability

1.  **Strict Mode:** Ensure `tsconfig.json` has `strict: true` and includes flags like `noUncheckedIndexedAccess`.
2.  **`readonly`:** All properties in component props and state types **must** be declared `readonly`.
3.  **Arrays:** Use `ReadonlyArray<T>` for arrays in types unless mutation is strictly required (rare in React state definitions).

### 2.3 Component Declaration

Components must be declared using `const` arrow functions, explicitly typed with their props.

```typescript
// ✅ DO
type CardProps = { readonly title: string; };
export const Card = ({ title }: CardProps) => { ... };

// ❌ FORBIDDEN
export const Card: React.FC<CardProps> = ({ title }) => { ... };
```

## 3\. Styling and Rendering (StyleX)

### 3.1 Exclusive use of StyleX

All styling must be done using StyleX definitions located in `*.styles.ts` files.

### 3.2 Forbidden Styling Practices

| Practice                                                     | Rationale                                                                        |
| :----------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **Inline Styles** (`style={...}`)                            | Runtime performance hit; violates separation of concerns.                        |
| **Anonymous Functions in JSX** (`onClick={() => handler()}`) | Creates new function reference on every render; hurts performance and stability. |

```typescript
// ❌ AVOID
return <button onClick={() => handleClick(id)} style={{ color: 'red' }} />;
return <button onClick={() => handleClick(id)} style={dynamicStyleObject} />;

// ✅ REQUIRED
const handleClick = () => submit(id);
return <button onClick={handleClick} {...stylex.props(styles.base)} />;
```

## 4\. Functional Programming & Pure Code

### 4.1 Functional Purity

Functions in `*.util.ts` and data transformations **must be pure**: given the same input, they always return the same output, and cause no side effects (API calls, logging, mutation).

### 4.2 Immutability

Never mutate state or data structures. Use functional methods (`.map`, `.filter`, spread syntax `...`) for transformations.

```typescript
// ❌ MUTATION
const newUser = user;
newUser.role = 'admin';

// ✅ IMMUTABILITY
const newUser = { ...user, role: 'admin' };
```

### 4.3 Handlers

All event handlers (internal or passed as props) must follow strict naming:

- **Props:** Start with `on` (e.g., `onSave`, `onClick`).
- **Internal:** Start with `handle` (e.g., `handleSubmit`, `handleCloseModal`).

## 5\. Automation and Sorting Standards

Predictability is enforced through strict alphabetical sorting, managed by ESLint and Prettier.

### 5.1 Import Aliasing

We use `@` as the root alias for `src/`. Relative imports are strictly forbidden outside of the immediate directory scope.

```typescript
// ✅ DO
import { myUtil } from '@/utils/my.util';

// ❌ DON'T
import { myUtil } from '../../../../utils/my.util';
```

### 5.2 Import Order (Mandatory Grouping)

Imports must be grouped and sorted alphabetically within the group.

1.  **Built-in:** `react`, `react-router`, etc.
2.  **External:** Third-party libraries (`@stylexjs/stylex`, `lodash`).
3.  **Internal (Aliased):** `@/features`, `@/components`.
4.  **Relative (Parent/Sibling):** `./styles`, `../hooks`.

### 5.3 Alphabetical Sorting Rules

All keys and members must be sorted alphabetically.

| Item                                | Sorting Rule                                   | Example                                                 |
| :---------------------------------- | :--------------------------------------------- | :------------------------------------------------------ |
| **Type/Prop Members**               | Strict A-Z. (`id` is allowed first exception). | `id, age, email, name`                                  |
| **Component Props (Destructuring)** | Strict A-Z.                                    | `({ id, isActive, name, onSave })`                      |
| **JSX Props**                       | Strict A-Z.                                    | `<Button isDisabled={...} label={...} onClick={...} />` |
| **Object Keys**                     | Strict A-Z.                                    | `{ theme: 'dark', version: '1.0.0' }`                   |

## 6\. Data Layer (React Router 7)

### 6.1 Data Fetching Rule

Data fetching inside components using `useEffect` is strictly forbidden. All server data must be handled by **React Router Loaders** and **Actions**.

### 6.2 Naming and Usage

- **Read Operations:** Use `loader` functions in the route module. Data is consumed in the component using the typed `useLoaderData<typeof loader>()`.
- **Write Operations:** Use `action` functions for mutations (POST, PUT, DELETE). UI uses `useFetcher` or `useSubmit` to trigger actions.

This document is the source of truth for all code contribution.
