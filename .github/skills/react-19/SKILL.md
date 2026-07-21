---
name: react-19
description: >
  React 19 features and patterns with React Compiler (Actions, use() hook, refs as props, compiler-safe patterns).
  Use when writing or modifying React components, hooks, context, or form actions in .tsx/.jsx files.
user-invocable: true
paths: ['**/*.tsx', '**/*.jsx']
allowed-tools: Read
---

# React 19

## When to Apply

- Writing or refactoring React 19 components and hooks in `.tsx`/`.jsx`
- Migrating React 18 patterns to React 19 (`use()`, refs-as-props, actions)
- Enforcing React Compiler-safe patterns in component code

> **State & context architecture**: This skill covers React 19 APIs only. If you are building or modifying any shared state, context, or store — read `/store-pattern` first. The store-pattern is the only approved pattern for shared UI state in this project.

## 🚨 CRITICAL: Reference Files are MANDATORY

**This SKILL.md provides OVERVIEW only. For EXACT patterns:**

| Task                             | MANDATORY Reading                                   |
| -------------------------------- | --------------------------------------------------- |
| **Advanced Features & Patterns** | ⚠️ [references/advanced.md](references/advanced.md) |

**⚠️ DO NOT implement complex React 19 features without reading [advanced.md](references/advanced.md) FIRST.**

---

## Imports (REQUIRED)

```typescript
// ✅ ALWAYS: Named imports
import { useState, useEffect, useRef, use } from 'react';
import type { ReactNode } from 'react';

// ❌ NEVER: Default or namespace imports
import React from 'react';
import * as React from 'react';
React.useState(); // Wrong
```

## Component Declaration (REQUIRED)

```typescript
// ✅ ALWAYS: Arrow function + readonly props + named export
// Wrapping a native element? Take `ComponentPropsWithoutRef<'x'>` instead and
// get its attributes (and `children`) for free. Full decision table in
// .claude/rules/react-components.md § Props Typing. Never `PropsWithChildren`:
// it makes children optional and non-readonly (blocked by no-restricted-imports).
type ProductListProps = {
  readonly onSelect: (id: string) => void;
  readonly products: readonly Product[];
};

export const ProductList = ({ products, onSelect }: ProductListProps) => {
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id} onClick={() => onSelect(p.id)}>
          {p.name}
        </li>
      ))}
    </ul>
  );
};

// ❌ NEVER: function declaration for components
export function ProductList({ products }: ProductListProps) { ... }

// ❌ NEVER: React.FC — banned repo-wide (AGENTS.md Rule 1)
export const ProductList: React.FC<ProductListProps> = ({ products }) => { ... }

// ❌ NEVER: default export (unless required by framework)
export default ProductList;

// ✅ EXCEPTION: React Router route modules require default export
// routes/home.tsx
export const MyRoute = () => { ... }
export default MyRoute;
```

## No Manual Memoization (REQUIRED)

React Compiler handles optimization automatically. Never use `useMemo`, `useCallback`, or `memo` manually.

```typescript
// ✅ React Compiler optimizes automatically
export const ProductList = ({ products }: ProductListProps) => {
  const filtered = products.filter((p) => p.inStock);
  const sorted = [...filtered].sort((a, b) => a.price - b.price);

  const handleAddToCart = (id: string) => {
    addToCart(id);
  };

  return <List items={sorted} onAdd={handleAddToCart} />;
};

// ❌ NEVER: Manual memoization
const filtered = useMemo(() => products.filter((p) => p.inStock), [products]);
const sorted = useMemo(() => filtered.sort((a, b) => a.price - b.price), [filtered]);
const handleAddToCart = useCallback((id) => addToCart(id), []);
```

---

## 🚫 Critical Anti-Patterns

- **DO NOT** use `useMemo`, `useCallback`, or `memo` manually → React Compiler handles this automatically.
- **DO NOT** use function declarations for components → Use arrow functions + a `readonly` props type + named export.
- **DO NOT** create promises inside a component's render and pass them to `use()` → Always pass promises from outside or parent.
- **DO NOT** use `forwardRef` → In React 19, `ref` is a regular prop.
- **DO NOT** use `useContext()` → Always use `use()` instead; it supports conditional calls and `useContext` is forbidden project-wide.
- **DO NOT** use plain `createContext` for shared or complex UI state → Use the store-pattern — see `/store-pattern`. Plain context is only for low-volatility globals (theme, locale).
- **DO NOT** use `className`, `style={{}}`, CSS Modules, or Tailwind → All styling uses StyleX exclusively (`@stylexjs/stylex`).

---

## use() Hook for Promises

Read promises in render. React suspends until resolved.

```typescript
import { use, Suspense } from "react";

type CommentsProps = {
  readonly commentsPromise: Promise<Comment[]>;
};

// Read promises (requires Suspense boundary)
export const Comments = ({ commentsPromise }: CommentsProps) => {
  const comments = use(commentsPromise);
  return (
    <>
      {comments.map((c) => (
        <p key={c.id}>{c.text}</p>
      ))}
    </>
  );
};

export const Page = ({ commentsPromise }: CommentsProps) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
};
```

**Important**: `use()` does NOT support promises created in render. Pass promises from outside the component.

```typescript
// ❌ NEVER: Create promise in render
export const Component = () => {
  const data = use(fetchData()); // Error!
  return <div>{data}</div>;
};

// ✅ Promise created outside and passed as prop
export const Parent = () => {
  const dataPromise = fetchData();
  return <Child promise={dataPromise} />;
};

export const Child = ({ promise }: { promise: Promise<Data> }) => {
  const data = use(promise);
  return <div>{data}</div>;
};
```

## use() Hook for Context

Read Context conditionally (not possible with `useContext`).

```typescript
import { use } from "react";

type HeadingProps = { readonly children: ReactNode };

export const Heading = ({ children }: HeadingProps) => {
  if (children == null) {
    return null;
  }

  // ✅ Can use after early return
  const theme = use(ThemeContext);

  return <h1 data-theme={theme}>{children}</h1>;
};

// ❌ useContext doesn't work after early returns
export const HeadingWrong = ({ children }: HeadingProps) => {
  if (children == null) {
    return null;
  }

  const theme = useContext(ThemeContext); // Error: unreachable
  return <h1>{children}</h1>;
};
```

**Key difference**: `use()` can be called conditionally, `useContext()` cannot.

**Project rule**: `use()` for context is only appropriate when consuming low-volatility global values (theme, locale). For shared or complex UI state, use the **store-pattern** instead — see `/store-pattern`.

## Actions with useTransition

Handle async operations with automatic pending states.

```typescript
import { useState, useTransition } from "react";

export const UpdateName = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const error = await updateName(name);
      if (error) {
        setError(error);
        return;
      }
      // Success - navigate or update UI
    });
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Updating..." : "Update"}
      </button>
      {error && <p>{error}</p>}
    </div>
  );
};
```

## useActionState for Forms

Simplifies form handling with automatic pending states and error management.

```typescript
import { useActionState } from "react";
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  error: { color: 'red' },
  success: { color: 'green' },
});

// Action function
const updateName = async (previousState: State | null, formData: FormData) => {
  const name = formData.get("name");
  const error = await saveNameToAPI(name);

  if (error) {
    return { error }; // Return error state
  }

  return { success: true }; // Return success state
}

// Component
export const NameForm = () => {
  const [state, formAction, isPending] = useActionState(updateName, null);

  return (
    <form action={formAction}>
      <input type="text" name="name" required />
      <button disabled={isPending}>{isPending ? "Saving..." : "Save"}</button>
      {state?.error && <p {...stylex.props(styles.error)}>{state.error}</p>}
      {state?.success && <p {...stylex.props(styles.success)}>Saved!</p>}
    </form>
  );
};
```

**Project rule**: Use `useActionState` for client-only form state (validation UX, no server round-trip). For server mutations, use React Router `action` + `useFetcher` instead — see `/react-router-framework-mode`.

## useOptimistic for Instant UI Updates

Show optimistic state while async request is in progress.

```typescript
import { useOptimistic } from "react";
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  pending: { opacity: 0.5 },
});

type TodoListProps = {
  readonly addTodo: (title: string) => Promise<void>;
  readonly todos: readonly Todo[];
};

export const TodoList = ({ todos, addTodo }: TodoListProps) => {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, { ...newTodo, pending: true }]
  );

  const handleAdd = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const tempId = crypto.randomUUID();

    // Show optimistic update immediately
    addOptimisticTodo({ id: tempId, title, pending: true });

    // Perform actual request
    await addTodo(title);

    // React automatically reverts to real state when done
  };

  return (
    <form action={handleAdd}>
      <input name="title" required />
      <button>Add</button>
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id} {...stylex.props(todo.pending && styles.pending)}>
            {todo.title}
          </li>
        ))}
      </ul>
    </form>
  );
};
```

## ref as Prop (No forwardRef)

```typescript
type InputProps = ComponentPropsWithRef<'input'>;

// ✅ React 19: ref is just a prop
export const Input = ({ ref, placeholder, ...props }: InputProps) => {
  return <input ref={ref} placeholder={placeholder} {...props} />;
};

// Usage
export const Form = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <Input ref={inputRef} placeholder="Name" />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </div>
  );
};

// ❌ Old way (unnecessary in React 19)
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

## ref Cleanup Functions

```typescript
// ✅ Return cleanup function from ref callback
export const VideoPlayer= () => {
  return (
    <video
      ref={(ref) => {
        if (ref) {
          // Setup
          const player = new VideoPlayer(ref);
          player.init();

          // Return cleanup
          return () => {
            player.destroy();
          };
        }
      }}
    />
  );
};

// ❌ Don't use implicit returns (TypeScript error)
<div ref={(current) => (instance = current)} />

// ✅ Use explicit block
<div ref={(current) => { instance = current }} />
```

## Context as Provider

> **⚠️ Project rule**: Plain `createContext` is only for low-volatility global values (theme, locale) that update rarely and don't need granular subscriptions. For any shared or complex UI state, use the **store-pattern** instead — see `/store-pattern`. Always read context with `use()`, never `useContext()`.

```typescript
import { createContext, use } from "react";
import type { ReactNode } from "react";

const ThemeContext = createContext("light");

type AppProps = {
  readonly children: ReactNode;
};

// ✅ React 19: Use Context directly as provider
export const App = ({ children }: AppProps) => {
  return <ThemeContext value="dark">{children}</ThemeContext>;
};

// ❌ Old way — and `React.FC` is banned repo-wide (AGENTS.md Rule 1), as is
//    the `React.` namespace access shown here. Kept only to name the pattern.
export const AppOld: React.FC<AppProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
  );
};

// ✅ Reading context — always use(), never useContext()
export const Button = () => {
  const theme = use(ThemeContext);
  return <button>{theme}</button>;
};
```

## Form Actions (React DOM)

Native form integration with Actions.

```typescript
// ✅ Pass function to action prop
export const ContactForm = () => {
  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email");
    const message = formData.get("message");

    await sendEmail(email, message);

    // Form resets automatically on success
  };

  return (
    <form action={handleSubmit}>
      <input type="email" name="email" required />
      <textarea name="message" required />
      <button>Send</button>
    </form>
  );
};
```

**Project rule**: Native form actions suit progressive-enhancement scenarios. For server data mutations in this app, prefer React Router `action` exports + `useFetcher` — see `/react-router-framework-mode`.

## useFormStatus (React DOM)

Access form status without prop drilling.

```typescript
import { useFormStatus } from "react-dom";

type SubmitButtonProps =  Omit<
  ComponentPropsWithoutRef<'button'>,
  'onClick'
> & {readonly onClick?: (() => void) | MouseEventHandler<HTMLButtonElement>;};

// Design system button
export const SubmitButton = ({ children }: SubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting..." : children}
    </button>
  );
};

// Usage in form
export const Form = () => {
  return (
    <form action={handleSubmit}>
      <input name="name" />
      <SubmitButton>Save</SubmitButton>
    </form>
  );
};
```

**Note**: `useFormStatus` must be called inside a child component of a form element.

## useDeferredValue with Initial Value

```typescript
import { useDeferredValue, useState } from "react";

export const SearchResults = () => {
  const [query, setQuery] = useState("");

  // ✅ React 19: Provide initial value
  const deferredQuery = useDeferredValue(query, "");

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Results query={deferredQuery} />
    </div>
  );
};
```

## Resources

- **Advanced Features**: [references/advanced.md](references/advanced.md) - Metadata, Stylesheets, Scripts, Preloading, Breaking Changes
- **Official Docs**: [React 19 Release](https://react.dev/blog/2024/12/05/react-19)
- **Upgrade Guide**: [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

## Further Documentation

- [references/advanced.md](references/advanced.md)
