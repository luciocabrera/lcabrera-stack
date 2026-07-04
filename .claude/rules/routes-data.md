---
paths:
  [
    '**/routes/**',
    '**/routes.ts',
    '**/services/**',
    '**/*.api.ts',
    '**/react-router.config.ts',
    '**/entry.server.tsx',
  ]
---

# Data Layer — React Router 7

> For full framework-mode patterns (route modules, forms, navigation, pending/optimistic UI, sessions), invoke the `react-router-framework-mode` skill.

## Data Fetching

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

## Client State

- **Local UI state:** `useState`, `useReducer`
- **Shared / complex UI state:** the store-pattern (split context + `useSyncExternalStore`) — the **only** allowed pattern; no Redux, no Zustand, no ad-hoc Context+useState trees. Invoke the `store-pattern` skill before implementing.

## Error Handling & Validation

- **Error Boundaries:** All route components must be wrapped in error boundaries using `useRouteError`.
- **Input Validation:** Use Zod schemas for runtime type safety (especially in loaders/actions).
- **Type Guards:** Use `is` return type for runtime type narrowing with `unknown` data.
- **Environment Variables:** Validate with Zod schema, never commit secrets.
