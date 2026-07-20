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

## Server-Only Modules (`.server`)

Code that must never reach the browser — database access (`getPool`, `pg`, the
`@repo/data-access/db` executors), secret handling, `node:*` builtins — belongs in a
**server-only module** ([RR framework convention](https://reactrouter.com/api/framework-conventions/server-modules)).
Two equivalent forms; both make the build **fail** if a client-reachable module imports
them (RR 8's plugin matches `/\.server\//` on the resolved path **and** the `.server.<ext>`
suffix, so a nested `.server/` under `routes/` is enforced too):

- **`.server.ts` file suffix** — a single leaf module (e.g. `auth/signAuthPayload.server.ts`
  wrapping `node:crypto`).
- **`.server/` directory** — every file inside is server-only regardless of its own name, so
  files keep their semantic suffix (e.g. `enterprise-orders/.server/enterpriseOrders.service.ts`).
  Prefer this when several server-only modules cluster together.

Rules:

- **Route modules must NEVER be `.server`** (`.loader.ts`, `.action.ts`, `.meta.ts`, `root.ts`,
  the route component). RR already server-strips loaders/actions and needs the module in **both**
  graphs — marking it `.server` is a build error. The server-only code lives in a `.server`
  module and the loader/action **imports** it (it does not `getPool()` directly).
- **`.clientAction` runs in the browser** — it must not import a `.server` module.
- A plain `server/` folder gives **no** guarantee — it is just a folder. Use `.server/`.
- **Lint catches it before the build.** The RR apps opt into `enforceServerClientImportBoundary`
  (shared eslint config), which fails the gate when a non-`.server` file makes a runtime import of
  a server-only primitive — `node:*`, `pg`, or anything under `@repo/data-access/db` (the pool +
  executors). Matched by path, so new db utils are covered automatically; type-only imports stay
  allowed (e.g. the erasable `db/queryBuilder` `*.types`). So the boundary is enforced twice: fast
  at lint time, and definitively at build time.
- **Blueprint:** `apps/react-router/src/routes/enterprise-orders/.server/` is the reference; new
  apps and features follow it. All tooling (vitest, oxlint, eslint, oxfmt) still discovers and
  checks files inside `.server/` — the dot does not exempt them.

## Client State

- **Local UI state:** `useState`, `useReducer`
- **Shared / complex UI state:** the store-pattern (split context + `useSyncExternalStore`) — the **only** allowed pattern; no Redux, no Zustand, no ad-hoc Context+useState trees. Invoke the `store-pattern` skill before implementing.

## Error Handling & Validation

- **Error Boundaries:** All route components must be wrapped in error boundaries using `useRouteError`.
- **Input Validation:** Use Zod schemas for runtime type safety (especially in loaders/actions).
- **Type Guards:** Use `is` return type for runtime type narrowing with `unknown` data.
- **Environment Variables:** Validate with Zod schema, never commit secrets.
