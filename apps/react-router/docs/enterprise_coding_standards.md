# 🚀 Enterprise Coding Standards: React 19 / TypeScript / StyleX / React Router 7

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Status:** Mandatory for all production code

---

## Table of Contents

1. [Architecture & File Structure](#1-architecture--file-structure)
2. [TypeScript Standards](#2-typescript-standards)
3. [Component Design Principles](#3-component-design-principles)
4. [Styling Standards (StyleX)](#4-styling-standards-stylex)
5. [Functional Programming & Purity](#5-functional-programming--purity)
6. [Data Layer & State Management](#6-data-layer--state-management)
7. [React 19 Specific Features](#7-react-19-specific-features)
8. [Error Handling & Validation](#8-error-handling--validation)
9. [Testing Requirements](#9-testing-requirements)
10. [Performance Standards](#10-performance-standards)
11. [Code Organization & Automation](#11-code-organization--automation)
12. [Documentation Standards](#12-documentation-standards)
13. [Security Guidelines](#13-security-guidelines)

---

## 1. Architecture & File Structure

### 1.1 Feature-Based Architecture

Organize code by business domain, not technical layer. Each feature is self-contained with clear boundaries.

```
src/
├── features/
│   └── authentication/
│       ├── services/
│       │   ├── authApi.service.ts      # API calls, external integrations
│       │   └── authLoader.ts           # React Router data operations
│       ├── components/
│       │   └── LoginButton/
│       │       ├── LoginButton.tsx
│       │       ├── LoginButton.styles.ts
│       │       ├── LoginButton.types.ts
│       │       ├── LoginButton.test.tsx
│       │       └── index.ts
│       ├── hooks/
│       │   └── useAuthStatus.hook.ts
│       ├── utils/
│       │   └── tokenValidator.util.ts
│       └── index.ts                    # Feature public API
├── shared/
│   ├── components/                     # Reusable UI components
│   ├── hooks/                          # Cross-feature hooks
│   ├── types/                          # Global type definitions
│   └── utils/                          # Shared utilities
└── config/
    ├── constants.ts
    └── routes.ts
```

### 1.2 File Naming Convention

Every file must have a clear, predictable suffix indicating its purpose.

| Type          | Pattern           | Example                  | Purpose                       |
| ------------- | ----------------- | ------------------------ | ----------------------------- |
| **Component** | `*.component.tsx` | `UserCard.component.tsx` | React component               |
| **Hook**      | `*.hook.ts`       | `useUserData.hook.ts`    | Custom React hook             |
| **Utility**   | `*.util.ts`       | `dateFormatter.util.ts`  | Pure utility function         |
| **Service**   | `*.service.ts`    | `userApi.service.ts`     | External service integration  |
| **Style**     | `*.styles.ts`     | `UserCard.styles.ts`     | StyleX definitions            |
| **Type**      | `*.types.ts`      | `UserCard.types.ts`      | TypeScript type definitions   |
| **Test**      | `*.test.tsx`      | `UserCard.test.tsx`      | Unit/integration tests        |
| **Constant**  | `*.const.ts`      | `validation.const.ts`    | Immutable constants           |
| **Schema**    | `*.schema.ts`     | `user.schema.ts`         | Validation schemas (Zod, Yup) |

### 1.3 Barrel Files (Public APIs)

Each directory must expose a controlled public API via `index.ts`. Internal implementation details remain private.

```typescript
// ✅ Good: Explicit, controlled exports
// src/features/authentication/index.ts
export { LoginButton } from "./components/LoginButton";
export { useAuthStatus } from "./hooks/useAuthStatus.hook";
export type { AuthUser, AuthState } from "./types/auth.types";

// ❌ Bad: Re-exporting everything
export * from "./components/LoginButton";
```

**Benefits:**

- Encapsulation: Internal refactoring doesn't break consumers
- Discoverability: Clear public API surface
- Tree-shaking: Better dead code elimination

---

## 2. TypeScript Standards

### 2.1 Strict Configuration

`tsconfig.json` must enforce maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### 2.2 Type vs Interface

**Mandate:** Always use `type` for consistency and flexibility.

```typescript
// ✅ Correct: Type alias
export type User = {
  readonly id: string;
  readonly email: string;
  readonly role: "admin" | "user";
};

// ✅ Correct: Union types
export type Response = SuccessResponse | ErrorResponse;

// ❌ Forbidden: Interface
export interface User {
  id: string;
  email: string;
}
```

**Rationale:**

- Types support unions, intersections, and mapped types
- Prevents accidental declaration merging
- More predictable behavior in complex scenarios

### 2.3 Immutability in Types

All type definitions must use `readonly` to enforce immutability at the type level.

```typescript
// ✅ Correct: Immutable types
export type Config = {
  readonly apiUrl: string;
  readonly timeout: number;
  readonly features: ReadonlyArray<string>;
};

// ❌ Forbidden: Mutable types
export type Config = {
  apiUrl: string;
  timeout: number;
  features: string[];
};
```

### 2.4 Type Safety Patterns

#### No `any`

```typescript
// ❌ Forbidden
const processData = (data: any) => { ... };

// ✅ Use `unknown` with type guards
const processData = (data: unknown) => {
  if (isValidData(data)) {
    // data is now properly typed
  }
};
```

#### Discriminated Unions for State

```typescript
// ✅ Correct: Type-safe state machine
export type FetchState<T> =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly data: T }
  | { readonly status: "error"; readonly error: Error };
```

#### Branded Types for Safety

```typescript
// ✅ Prevent mixing up IDs
export type UserId = string & { readonly __brand: "UserId" };
export type ProductId = string & { readonly __brand: "ProductId" };
```

### 2.5 Function Parameter Standards

**Mandate:** All functions with 2+ parameters OR functions likely to evolve must use object parameters with a typed `Args` suffix.

#### When to Use Object Parameters

```typescript
// ✅ Use object params: 2+ parameters
type FormatCurrencyArgs = {
  readonly amount: number;
  readonly currency: string;
};

export const formatCurrency = ({ amount, currency }: FormatCurrencyArgs): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

// ✅ Use object params: Future-proof (likely to grow)
type CreateUserArgs = {
  readonly email: string;
  readonly name?: string;
  readonly role?: string;
};

export const createUser = ({ email, name, role = "user" }: CreateUserArgs): User => {
  // Easy to add parameters later without breaking changes
  return { email, name: name ?? email.split("@")[0], role };
};

// ✅ Single primitive parameter: Direct typing acceptable
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

// ✅ Single complex parameter: Direct typing acceptable
export const processUser = (user: User): ProcessedUser => {
  return { ...user, processed: true };
};
```

#### Benefits of Object Parameters

1. **Order Independence**: No need to remember parameter positions
2. **Self-Documenting**: Clear intent at call site
3. **Easy Evolution**: Add parameters without breaking existing calls
4. **Default Values**: Natural support for optional parameters
5. **Refactoring Safety**: Renaming is safer with named parameters

```typescript
// ❌ Positional parameters: Error-prone, unclear
calculatePrice(100, 0.08, true, "USD", null, false);

// ✅ Object parameters: Self-documenting, maintainable
calculatePrice({
  amount: 100,
  currency: "USD",
  includeShipping: false,
  isPremium: true,
  taxRate: 0.08,
  discountCode: null,
});
```

#### Naming Convention

- Function parameter types: **Always** use `Args` suffix
- Component props: Use `Props` suffix
- Hook parameters: Use `Args` suffix
- Return types: Use `Result` or `Return` suffix (when needed)

```typescript
// Function parameters
type CalculateTotalArgs = { ... };
export const calculateTotal = (args: CalculateTotalArgs): number => { ... };

// Component props
type ButtonProps = { ... };
export const Button = (props: ButtonProps) => { ... };

// Hook parameters
type UseUserDataArgs = { readonly userId: string };
export const useUserData = ({ userId }: UseUserDataArgs) => { ... };

// Complex return type
type FetchUserResult = {
  readonly user: User | null;
  readonly error: Error | null;
};
export const fetchUser = (args: FetchUserArgs): FetchUserResult => { ... };
```

### 2.6 Component Typing

```typescript
// ✅ Correct: Explicit arrow function with typed props
type ButtonProps = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onClick: () => void;
};

export const Button = ({ disabled = false, label, onClick }: ButtonProps) => {
  return <button disabled={disabled} onClick={onClick}>{label}</button>;
};

// ❌ Forbidden: React.FC (loses defaultProps, makes children implicit)
export const Button: React.FC<ButtonProps> = ({ label, onClick }) => { ... };
```

---

## 3. Component Design Principles

### 3.1 Single Responsibility Principle

Each component should have one clear reason to exist and change.

```typescript
// ❌ Bad: Multiple responsibilities
const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

  // Fetching logic
  useEffect(() => { fetchUser(); }, []);
  useEffect(() => { fetchOrders(); }, []);

  // Rendering user info AND orders
  return <div>...</div>;
};

// ✅ Good: Separated concerns
const UserProfile = () => {
  const user = useLoaderData<typeof loader>();

  return (
    <div>
      <UserInfo user={user} />
      <UserOrders userId={user.id} />
    </div>
  );
};
```

### 3.2 Component Composition Over Configuration

Favor composition and slot patterns over props-driven configuration.

```typescript
// ❌ Avoid: Props explosion
type CardProps = {
  readonly title: string;
  readonly showHeader: boolean;
  readonly headerColor: string;
  readonly showFooter: boolean;
  readonly footerAlign: 'left' | 'right';
  // ... 20 more props
};

// ✅ Prefer: Composition
type CardProps = {
  readonly children: React.ReactNode;
  readonly header?: React.ReactNode;
  readonly footer?: React.ReactNode;
};

// Usage
<Card
  header={<CardHeader title="User" />}
  footer={<CardFooter actions={...} />}
>
  <CardContent>...</CardContent>
</Card>
```

### 3.3 Props Naming Conventions

| Type                       | Pattern                | Example                                   |
| -------------------------- | ---------------------- | ----------------------------------------- |
| **Event Handlers (Props)** | `on[Event]`            | `onClick`, `onSave`, `onClose`            |
| **Internal Handlers**      | `handle[Event]`        | `handleClick`, `handleSubmit`             |
| **Boolean Props**          | `is/has/should[State]` | `isLoading`, `hasError`, `shouldValidate` |
| **Render Props**           | `render[Thing]`        | `renderHeader`, `renderEmpty`             |

```typescript
type TableProps = {
  readonly data: ReadonlyArray<User>;
  readonly isLoading: boolean;
  readonly onRowClick: (user: User) => void;
  readonly renderEmpty?: () => React.ReactNode;
};

export const Table = ({ data, isLoading, onRowClick, renderEmpty }: TableProps) => {
  const handleRowClick = (user: User) => {
    // Internal logic
    onRowClick(user);
  };

  // ...
};
```

### 3.4 Prop Destructuring Order

Always alphabetize destructured props for consistency.

```typescript
// ✅ Correct: Alphabetical
const Button = ({ className, disabled, label, onClick, variant }: ButtonProps) => {
  // ...
};

// ❌ Incorrect: Random order
const Button = ({ onClick, label, disabled, variant, className }: ButtonProps) => {
  // ...
};
```

---

## 4. Styling Standards (StyleX)

### 4.1 StyleX Exclusive

All styling must use StyleX. No exceptions.

```typescript
// ✅ Correct: StyleX definitions
// Button.styles.ts
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  base: {
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
  },
  primary: {
    backgroundColor: 'blue',
    color: 'white',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

// Button.tsx
import * as stylex from '@stylexjs/stylex';
import { styles } from './Button.styles';

export const Button = ({ disabled, variant }: ButtonProps) => (
  <button
    {...stylex.props(
      styles.base,
      variant === 'primary' && styles.primary,
      disabled && styles.disabled
    )}
  />
);
```

### 4.2 Forbidden Styling Practices

| Practice                                     | Why Forbidden                                 | Penalty         |
| -------------------------------------------- | --------------------------------------------- | --------------- |
| **Inline styles** `style={...}`              | Runtime cost, no type safety, unoptimized     | Blocking review |
| **Anonymous functions** `onClick={() => {}}` | New reference each render, breaks memoization | Blocking review |
| **CSS Modules**                              | Inconsistent with StyleX architecture         | Blocking review |
| **Styled Components**                        | Runtime overhead, conflicts with StyleX       | Blocking review |

```typescript
// ❌ Forbidden Patterns
<div style={{ color: 'red' }}>Text</div>
<div style={dynamicStyleObject}>Text</div>
<button onClick={() => handleClick(id)}>Click</button>

// ✅ Required Patterns
<div {...stylex.props(styles.error)}>Text</div>
<button onClick={handleClick}>Click</button>
```

### 4.3 Style Organization

```typescript
// ✅ Group related styles, alphabetize keys
export const styles = stylex.create({
  // Base styles
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  // State variants
  disabled: { opacity: 0.5 },
  focused: { outline: "2px solid blue" },

  // Size variants
  large: { fontSize: "18px", padding: "16px" },
  small: { fontSize: "14px", padding: "8px" },
});
```

---

## 5. Functional Programming & Purity

### 5.1 Pure Functions

All utility functions must be pure: deterministic and side-effect free.

```typescript
// ✅ Pure: Same input → Same output, no side effects
type FormatCurrencyArgs = {
  readonly amount: number;
  readonly currency: string;
};

export const formatCurrency = ({ amount, currency }: FormatCurrencyArgs): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

// Usage
const price = formatCurrency({ amount: 1234.56, currency: "USD" });

// ❌ Impure: Relies on external state
let globalTax = 0.08;
type CalculateTotalArgs = { readonly price: number };
export const calculateTotal = ({ price }: CalculateTotalArgs): number => {
  return price * (1 + globalTax); // External dependency
};

// ❌ Impure: Has side effects
type SaveUserArgs = { readonly user: User };
export const saveUser = ({ user }: SaveUserArgs): User => {
  console.log("Saving user"); // Side effect: logging
  localStorage.setItem("user", JSON.stringify(user)); // Side effect: storage
  return user;
};
```

### 5.2 Immutability Enforcement

Never mutate data structures. Use functional methods and spread syntax.

```typescript
// ❌ Mutation
type AddUserArgs = {
  readonly users: User[];
  readonly newUser: User;
};
const addUser = ({ users, newUser }: AddUserArgs) => {
  users.push(newUser); // Mutates input
  return users;
};

// ✅ Immutability
type AddUserArgs = {
  readonly users: ReadonlyArray<User>;
  readonly newUser: User;
};
const addUser = ({ users, newUser }: AddUserArgs): ReadonlyArray<User> => {
  return [...users, newUser];
};

// ❌ Mutation
type UpdateUserRoleArgs = {
  readonly user: User;
  readonly role: string;
};
const updateUserRole = ({ user, role }: UpdateUserRoleArgs) => {
  user.role = role; // Mutates input
  return user;
};

// ✅ Immutability
const updateUserRole = ({ user, role }: UpdateUserRoleArgs): User => {
  return { ...user, role };
};
```

### 5.3 Functional Array Operations

Use functional methods exclusively. Avoid imperative loops.

```typescript
// ❌ Imperative
const activeUsers = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) {
    activeUsers.push(users[i]);
  }
}

// ✅ Functional
const activeUsers = users.filter((user) => user.isActive);

// ✅ Chaining
const activeUserNames = users
  .filter((user) => user.isActive)
  .map((user) => user.name)
  .sort();
```

### 5.4 Avoiding Side Effects in Components

```typescript
// ❌ Side effect in render
const UserList = ({ users }: { users: User[] }) => {
  const sortedUsers = users.sort(); // Mutates prop!
  return <div>...</div>;
};

// ✅ Pure transformation
const UserList = ({ users }: { users: ReadonlyArray<User> }) => {
  const sortedUsers = [...users].sort();
  return <div>...</div>;
};

// ✅ Or use useMemo for expensive operations
const UserList = ({ users }: { users: ReadonlyArray<User> }) => {
  const sortedUsers = useMemo(() => [...users].sort(), [users]);
  return <div>...</div>;
};
```

---

## 6. Data Layer & State Management

### 6.1 Data Fetching Rule

**Zero `useEffect` for data fetching.** All server data must flow through React Router loaders/actions.

```typescript
// ❌ Forbidden: Component-level fetching
const UserProfile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/user').then(res => res.json()).then(setUser);
  }, []);

  return <div>{user?.name}</div>;
};

// ✅ Required: Router loader
// routes/user.ts
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const user = await fetchUser(params.userId);
  return user;
};

// UserProfile.tsx
const UserProfile = () => {
  const user = useLoaderData<typeof loader>();
  return <div>{user.name}</div>;
};
```

### 6.2 Loader Naming & Structure

```typescript
// userLoader.ts
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = params.userId;
  if (!userId) throw new Response("Not Found", { status: 404 });

  const user = await userApi.fetchUser(userId);
  return json({ user });
};

// Component consumption
const UserProfile = () => {
  const { user } = useLoaderData<typeof loader>();
  // Type-safe access to user
};
```

### 6.3 Actions for Mutations

```typescript
// userAction.ts
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);

  const validatedData = userSchema.parse(updates);
  await userApi.updateUser(validatedData);

  return redirect('/users');
};

// Component usage
const EditUser = () => {
  const fetcher = useFetcher();

  const handleSubmit = (data: UserUpdate) => {
    fetcher.submit(data, { method: 'POST' });
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

### 6.4 Client State Management

For UI-only state, use React hooks. For global client state, use Context or Zustand (not Redux).

```typescript
// ✅ Local UI state
const Modal = () => {
  const [isOpen, setIsOpen] = useState(false);
  return ...;
};

// ✅ Shared UI state (Context with React 19's use())
const ThemeContext = createContext<Theme | undefined>(undefined);

export const useTheme = () => {
  const theme = use(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
};

// ❌ Forbidden in React 19: useContext (deprecated)
export const useTheme = () => {
  const theme = useContext(ThemeContext); // Use use() instead
  return theme;
};
```

---

## 7. React 19 Specific Features

React 19 introduces powerful new APIs that modernize how we handle async operations, forms, and context. These patterns are mandatory for all new code.

### 7.1 The `use()` Hook

The `use()` hook replaces `useContext` and enables new patterns for consuming Promises and Context.

#### Context Consumption

```typescript
// ✅ React 19: use() for Context
import { use } from "react";

const ThemeContext = createContext<Theme | undefined>(undefined);

export const useTheme = () => {
  const theme = use(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return theme;
};

// ❌ Deprecated: useContext
import { useContext } from "react";
const theme = useContext(ThemeContext); // Use use() instead
```

#### Conditional Context Usage

```typescript
// ✅ use() can be called conditionally (useContext cannot)
type UserProfileProps = {
  readonly isAuthenticated: boolean;
};

const UserProfile = ({ isAuthenticated }: UserProfileProps) => {
  // This is valid with use()!
  const theme = isAuthenticated ? use(ThemeContext) : defaultTheme;

  return <div>...</div>;
};

// ❌ useContext cannot be conditional
const theme = isAuth ? useContext(ThemeContext) : null; // ❌ Breaks Rules of Hooks
```

#### Async Data with use()

```typescript
// ✅ use() with Promises (Suspense integration)
type UserDataProps = {
  readonly userPromise: Promise<User>;
};

const UserData = ({ userPromise }: UserDataProps) => {
  const user = use(userPromise); // Suspends until resolved
  return <div>{user.name}</div>;
};

// Parent component with Suspense boundary
const UserPage = () => {
  const userPromise = fetchUser({ userId: '123' });

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserData userPromise={userPromise} />
    </Suspense>
  );
};
```

### 7.2 Form Actions

React 19 has first-class support for form actions, eliminating the need for controlled components in many cases.

#### Basic Form Action

```typescript
// ✅ React 19: Form Actions with useActionState
import { useActionState } from 'react';

type CreateUserFormState = {
  readonly error?: string;
  readonly success?: boolean;
};

type CreateUserFormProps = {
  readonly onSuccess?: () => void;
};

const createUserAction = async (
  prevState: CreateUserFormState,
  formData: FormData
): Promise<CreateUserFormState> => {
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;

  try {
    await createUser({ email, name });
    return { success: true };
  } catch (error) {
    return { error: 'Failed to create user' };
  }
};

export const CreateUserForm = ({ onSuccess }: CreateUserFormProps) => {
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    { success: false }
  );

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <input name="name" type="text" required />

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>

      {state.error && <div>{state.error}</div>}
      {state.success && <div>User created successfully!</div>}
    </form>
  );
};
```

#### Form Action with React Router

```typescript
// ✅ Combine React 19 Forms with React Router Actions
// routes/users.ts
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;

  const result = userSchema.safeParse({ email, name });
  if (!result.success) {
    return json({ errors: result.error.flatten() }, { status: 400 });
  }

  await createUser({ email: result.data.email, name: result.data.name });
  return redirect('/users');
};

// Component
import { Form } from 'react-router';

export const CreateUserForm = () => {
  const navigation = useNavigation();
  const isPending = navigation.state === 'submitting';

  return (
    <Form method="post">
      <input name="email" type="email" required />
      <input name="name" type="text" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>
    </Form>
  );
};
```

### 7.3 useFormStatus for Pending States

Use `useFormStatus` to access form submission state from child components.

```typescript
// ✅ useFormStatus for submit button states
import { useFormStatus } from 'react-dom';

const SubmitButton = () => {
  const { pending, data } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
};

// Parent form
const UserForm = () => {
  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <SubmitButton /> {/* Has access to form pending state */}
    </form>
  );
};
```

### 7.4 useOptimistic for Optimistic Updates

Provide instant feedback while async operations complete.

```typescript
// ✅ Optimistic UI updates
import { useOptimistic } from 'react';

type Todo = {
  readonly id: string;
  readonly text: string;
  readonly completed: boolean;
};

type TodoListProps = {
  readonly todos: ReadonlyArray<Todo>;
};

const TodoList = ({ todos }: TodoListProps) => {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  );

  const handleAddTodo = async (formData: FormData) => {
    const text = formData.get('text') as string;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
    };

    // Immediately show optimistic update
    addOptimisticTodo(newTodo);

    // Actual server call
    await createTodo({ text });
  };

  return (
    <div>
      <form action={handleAddTodo}>
        <input name="text" required />
        <button type="submit">Add Todo</button>
      </form>

      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
};
```

### 7.5 Server Components (When Available)

If using React Server Components, follow these patterns:

```typescript
// ✅ Server Component (runs on server only)
// app/users/page.tsx
type UserListPageProps = {
  readonly searchParams: { readonly page?: string };
};

// Async Server Component
export default async function UserListPage({ searchParams }: UserListPageProps) {
  const page = Number(searchParams.page) || 1;

  // Direct async/await in component (Server Component only!)
  const users = await fetchUsers({ page, limit: 20 });

  return (
    <div>
      <h1>Users</h1>
      <UserList users={users} />
    </div>
  );
}

// ✅ Client Component (explicit)
// components/UserList.tsx
'use client'; // Mark as Client Component

import { useState } from 'react';

type UserListProps = {
  readonly users: ReadonlyArray<User>;
};

export const UserList = ({ users }: UserListProps) => {
  const [filter, setFilter] = useState('');
  // Client-side interactivity

  return <div>...</div>;
};
```

#### Server Component Guidelines

1. **Default to Server Components** - Only use `'use client'` when needed
2. **Client Components When:**
   - Using hooks (useState, useEffect, etc.)
   - Using browser APIs (localStorage, window)
   - Using event handlers (onClick, onChange)
   - Using Context providers
3. **Keep Client Boundaries Small** - Pass data from Server to Client Components as props
4. **Never import Server Components into Client Components** - Reverse is fine

### 7.6 Transitions for Non-Urgent Updates

Use `useTransition` to mark updates as non-urgent, keeping UI responsive.

```typescript
// ✅ useTransition for low-priority updates
import { useTransition, useState } from 'react';

type SearchResultsProps = {
  readonly onSearch: (query: string) => Promise<SearchResult[]>;
};

const SearchResults = ({ onSearch }: SearchResultsProps) => {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery); // Urgent: update input immediately

    startTransition(async () => {
      // Non-urgent: search can be interrupted
      const data = await onSearch(newQuery);
      setResults(data);
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={e => handleSearch(e.target.value)}
        placeholder="Search..."
      />

      {isPending && <div>Searching...</div>}

      <ul>
        {results.map(result => (
          <li key={result.id}>{result.title}</li>
        ))}
      </ul>
    </div>
  );
};
```

### 7.7 React 19 Migration Checklist

When updating existing code to React 19:

- [ ] Replace all `useContext` with `use()`
- [ ] Convert form handlers to use `useActionState` where appropriate
- [ ] Add `useFormStatus` to submit buttons for better UX
- [ ] Implement `useOptimistic` for operations that benefit from instant feedback
- [ ] Use `useTransition` for search, filtering, and other non-urgent updates
- [ ] Mark Client Components with `'use client'` directive (if using Server Components)
- [ ] Remove workarounds for async operations that are now native to React 19

---

## 8. Error Handling & Validation

### 7.1 Error Boundaries

All route components must be wrapped in error boundaries.

```typescript
// ErrorBoundary.tsx
export const ErrorBoundary = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  return <div>Unexpected Error</div>;
};
```

### 7.2 Input Validation

Use schema validation libraries (Zod, Yup) for runtime type safety.

```typescript
// user.schema.ts
import { z } from "zod";

export const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(120),
  role: z.enum(["admin", "user"]),
});

export type UserInput = z.infer<typeof userSchema>;

// Usage in action
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const raw = Object.fromEntries(formData);

  const result = userSchema.safeParse(raw);
  if (!result.success) {
    return json({ errors: result.error.flatten() }, { status: 400 });
  }

  await saveUser({ user: result.data });
  return redirect("/success");
};
```

### 7.3 Type Guards

```typescript
// Type guard pattern with Args
type IsUserArgs = {
  readonly value: unknown;
};

export const isUser = ({ value }: IsUserArgs): value is User => {
  return typeof value === "object" && value !== null && "id" in value && "email" in value;
};

// Usage
type ProcessDataArgs = {
  readonly data: unknown;
};

const processData = ({ data }: ProcessDataArgs) => {
  if (!isUser({ value: data })) {
    throw new Error("Invalid user data");
  }

  // data is now typed as User
  console.log(data.email);
};
```

---

## 9. Testing Requirements

### 8.1 Coverage Requirements

- **Unit Tests:** 80% minimum coverage
- **Integration Tests:** All critical user flows
- **E2E Tests:** Happy paths for core features

### 8.2 Testing Patterns

```typescript
// UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  it('displays user information correctly', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(<UserCard user={user} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = { id: '1', name: 'John', email: 'john@example.com' };

    render(<UserCard user={user} onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledWith(user);
  });
});
```

### 8.3 Test File Organization

```typescript
// ✅ Correct: Tests colocated with components
src/
  components/
    Button/
      ├── Button.tsx
      ├── Button.test.tsx
      ├── Button.styles.ts
      └── index.ts
```

---

## 10. Performance Standards

### 9.1 Memoization

Use memoization strategically for expensive computations and preventing unnecessary re-renders.

```typescript
// ✅ useMemo for expensive calculations
const sortedUsers = useMemo(() => {
  return users.slice().sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// ✅ useCallback for stable function references
const handleSave = useCallback(
  (data: FormData) => {
    onSave(data);
  },
  [onSave],
);

// ❌ Don't over-optimize simple operations
const total = useMemo(() => a + b, [a, b]); // Unnecessary
```

### 9.2 Code Splitting

```typescript
// ✅ Route-based code splitting
const AdminPanel = lazy(() => import('./features/admin/AdminPanel'));

// Usage in routes
{
  path: 'admin',
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminPanel />
    </Suspense>
  ),
}
```

### 9.3 Performance Monitoring

```typescript
// Use Profiler for performance-critical components
import { Profiler } from 'react';

const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) => {
  console.log(`${id} ${phase} took ${actualDuration}ms`);
};

<Profiler id="UserList" onRender={onRenderCallback}>
  <UserList users={users} />
</Profiler>
```

---

## 11. Code Organization & Automation

### 10.1 Import Aliasing

Use `@` as the root alias. Relative imports only within the same feature.

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}

// ✅ Correct
import { Button } from '@/shared/components/Button';
import { useAuth } from '@/features/auth/hooks/useAuth.hook';
import { styles } from './Button.styles'; // Same directory

// ❌ Forbidden
import { Button } from '../../../../shared/components/Button';
```

### 10.2 Import Order

ESLint must enforce this order with `eslint-plugin-import`:

1. **React & Core Libraries**
2. **External Dependencies** (alphabetical)
3. **Internal Absolute Imports** (alphabetical, using `@/`)
4. **Relative Imports** (alphabetical)
5. **Type Imports** (last, alphabetical)

```typescript
// ✅ Correct order
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import * as stylex from "@stylexjs/stylex";
import { z } from "zod";

import { Button } from "@/shared/components/Button";
import { useAuth } from "@/features/auth/hooks/useAuth.hook";

import { styles } from "./Card.styles";
import { formatDate } from "./utils";

import type { User } from "@/shared/types/user.types";
```

### 10.3 Alphabetical Sorting

All object keys, props, and type members must be alphabetically sorted.

```typescript
// ✅ Type members sorted (except 'id' first)
export type User = {
  readonly id: string;
  readonly age: number;
  readonly email: string;
  readonly name: string;
};

// ✅ JSX props sorted
<Button
  disabled={isDisabled}
  label="Submit"
  onClick={handleClick}
  variant="primary"
/>

// ✅ Object keys sorted
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  version: '1.0.0',
};
```

---

## 12. Documentation Standards

### 11.1 JSDoc for Public APIs

All exported functions, types, and components must have JSDoc comments.

````typescript
/**
 * Formats a number as currency with proper locale handling.
 *
 * @param args - Currency formatting parameters
 * @param args.amount - The numeric amount to format
 * @param args.currency - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @returns Formatted currency string
 *
 * @example
 * ```ts
 * formatCurrency({ amount: 1234.56, currency: 'USD' }) // "$1,234.56"
 * ```
 */
type FormatCurrencyArgs = {
  readonly amount: number;
  readonly currency: string;
};

export const formatCurrency = ({ amount, currency }: FormatCurrencyArgs): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};
````

### 11.2 README Files

Each feature must have a README explaining:

- Purpose and responsibility
- Key components and exports
- Usage examples
- Dependencies

```markdown
# Authentication Feature

## Overview

Handles user authentication, session management, and authorization.

## Components

- `LoginButton` - Triggers authentication flow
- `AuthGuard` - Protects routes requiring authentication

## Hooks

- `useAuth()` - Returns current authentication state

## Usage

\`\`\`tsx
import { LoginButton, useAuth } from '@/features/auth';

const App = () => {
const { user, isAuthenticated } = useAuth();

if (!isAuthenticated) {
return <LoginButton />;
}

return <div>Welcome, {user.name}</div>;
};
\`\`\`
```

---

## 13. Security Guidelines

### 12.1 Input Sanitization

Always validate and sanitize user input before processing.

```typescript
// ✅ Sanitize before rendering
import DOMPurify from 'isomorphic-dompurify';

const SafeHTML = ({ html }: { readonly html: string }) => {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

### 12.2 Authentication

```typescript
// ✅ Protected route pattern
const ProtectedRoute = ({ children }: { readonly children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### 12.3 Environment Variables

Never commit secrets. Use environment variables with validation.

```typescript
// config/env.ts
import { z } from "zod";

const envSchema = z.object({
  API_URL: z.string().url(),
  API_KEY: z.string().min(20),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

export const env = envSchema.parse({
  API_URL: process.env.VITE_API_URL,
  API_KEY: process.env.VITE_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
});
```

---

## Enforcement

### ESLint Configuration

All rules are enforced via ESLint with the following plugins:

- `@typescript-eslint/eslint-plugin`
- `eslint-plugin-react`
- `eslint-plugin-react-hooks`
- `eslint-plugin-import`
- `eslint-plugin-jsx-a11y`

### Pre-commit Hooks

Use Husky and lint-staged to enforce standards:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write", "vitest related --run"]
  }
}
```

### CI/CD Pipeline

All pull requests must pass:

1. Linting (`npm run lint`)
2. Type checking (`npm run type-check`)
3. Tests (`npm run test`)
4. Build (`npm run build`)

---

## Exceptions

Exceptions to these standards require:

1. Written justification
2. Approval from tech lead
3. Documentation in code comments

---

**Document Version:** 1.0.0  
**Last Review:** December 2025  
**Next Review:** March 2026
