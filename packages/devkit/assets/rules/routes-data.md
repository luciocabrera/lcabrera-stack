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

# Data Layer — React Router framework mode

> For full framework-mode patterns (route modules, forms, navigation, pending/optimistic UI, sessions), invoke the `react-router-framework-mode` skill.

## Data Fetching

**Zero `useEffect` for data fetching.** All server data flows through React Router loaders/actions.

- **Read operations:** `loader` functions → consumed via `useLoaderData<typeof loader>()`
- **Write operations:** `action` functions → triggered via `useFetcher` or `<Form>`
- **Loader data must be fully serializable (promises excepted).** Server loader results cross the single-fetch turbo-stream boundary, and functions are **silently** replaced with `undefined` on the client (`SingleFetchFallback` — no error, no warning). Never return function-carrying values from a loader. When the client genuinely has to _run_ something the loader chose, return a **serializable descriptor** — a plain object naming the operation and its arguments — and resolve it client-side, rather than returning the function itself. Values that can only be functions have to be re-attached in the component.

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

Code that must never reach the browser — database access (the driver, the connection
pool, the query executors), secret handling, `node:*` builtins — belongs in a
**server-only module** ([RR framework convention](https://reactrouter.com/api/framework-conventions/server-modules)).
Two equivalent forms; both make the build **fail** if a client-reachable module imports
them (RR 8's plugin matches `/\.server\//` on the resolved path **and** the `.server.<ext>`
suffix, so a nested `.server/` under `routes/` is enforced too):

- **`.server.ts` file suffix** — a single leaf module (e.g. `auth/signAuthPayload.server.ts`
  wrapping `node:crypto`).
- **`.server/` directory** — every file inside is server-only regardless of its own name, so
  files keep their semantic suffix (e.g. `orders/.server/orders.service.ts`).
  Prefer this when several server-only modules cluster together.

Rules:

- **Route modules must NEVER be `.server`** (`.loader.ts`, `.action.ts`, `.meta.ts`, `root.ts`,
  the route component). RR already server-strips loaders/actions and needs the module in **both**
  graphs — marking it `.server` is a build error. The server-only code lives in a `.server`
  module and the loader/action **imports** it (it does not `getPool()` directly).
- **`.clientAction` runs in the browser** — it must not import a `.server` module.
- A plain `server/` folder gives **no** guarantee — it is just a folder. Use `.server/`.
- **Have lint catch it before the build.** A rule that fails when a non-`.server` file makes a
  **runtime** import of a server-only primitive — `node:*`, the database driver, anything under the
  data-access directory — answers in a second rather than a build. Match by path, so new modules in
  that directory are covered without anyone maintaining a list, and keep type-only imports allowed:
  they erase, so they never reach the client bundle. The boundary is then enforced twice — fast at
  lint time, definitively at build time.
- **The dot does not exempt the files.** Test runners, linters and formatters still discover and
  check everything inside a `.server/` directory. It is a bundler boundary, not a hiding place.

## Client State

- **Local UI state:** `useState`, `useReducer`
- **Shared / complex UI state:** the store-pattern (split context + `useSyncExternalStore`) — the **only** allowed pattern; no Redux, no Zustand, no ad-hoc Context+useState trees. Invoke the `store-pattern` skill before implementing.

## Error Handling & Validation

- **Error Boundaries:** All route components must be wrapped in error boundaries using `useRouteError`.
- **Input Validation:** Use Zod schemas for runtime type safety (especially in loaders/actions).
- **Type Guards:** Use `is` return type for runtime type narrowing with `unknown` data.
- **Environment Variables:** Validate with Zod schema, never commit secrets.
