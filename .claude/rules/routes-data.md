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
- **Loader data must be fully serializable (promises excepted).** Server loader results cross the single-fetch turbo-stream boundary, and functions are **silently** replaced with `undefined` on the client (`SingleFetchFallback` — no error, no warning). Never return function-carrying values from a loader. The sanctioned path for column filter-option fetching is the **serializable descriptor** (ADR-009): loaders call `appendDistinctFilterDescriptors` (`@repo/ui/routing`) / `createStaticFilterOptions` and return descriptor-bearing `columns` directly; the client tool `resolveFilterOptionsDescriptor` executes them. Only columns carrying `render` functions still require the component-side re-attach workaround.

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
