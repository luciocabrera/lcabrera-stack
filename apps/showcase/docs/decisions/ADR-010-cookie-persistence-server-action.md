# ADR-010: All Cookie Writes Persist Through One Server Action

**Status:** Accepted

## Context

Persisted UI preferences (theme, global settings, and every table state slice
— filters, sorting, order, pinning, visibility, sizing, and the drawer UI
flags) are stored in cookies because a cookie is the only channel an SSR loader
can read on the next document request, letting the first paint match the
committed state and avoid a hydration layout shift.

Writing that cookie had drifted into **three divergent implementations of one
concept** ("persist this value to a cookie"), which `.claude/rules/react-components.md`
called out as an anti-pattern a clone detector cannot catch:

1. `setThemeCookie` / `usePersistGlobalSettingsAction` / `usePersistTableStateAction`
   POSTed to the `/_action/persist-cookie` server action so the `Set-Cookie`
   came from the server.
2. Column drag-resize (`persistColumnSizing` → `writeStateSlice`) and the drawer
   UI flags (`persistTableMetaUiState` → `writePersistedUiFlagsToCookie`) wrote
   `document.cookie` **directly** on the client.
3. The same helpers could also append a `Set-Cookie` header when handed SSR
   `Headers`.

The client-side `document.cookie` assignment in `writeToCookie.service.ts` was
also the **only `oxlint-disable` in all of `packages/ui`** (`unicorn/no-document-cookie`),
which the package — held strictest as a soon-to-be-public package — must not
carry. Swapping it for the `CookieStore` API would not have removed the
suppression: `CookieStore` is unsupported in Firefox (as of early 2026), so it
would still need a `document.cookie` fallback.

## Decision

**Every client-side cookie write goes through one primitive,
`usePersistCookieAction`** (`packages/ui/src/hooks/`), which submits entries to
the `/_action/persist-cookie` server action (`persistCookie.action.ts`); the
action returns the cookie(s) as `Set-Cookie` response headers via
`buildSetCookieHeaders`. The client no longer writes `document.cookie` at all —
`writeToCookie`, `writeToLocalStorage`, `writeStateSlice`, and
`writePersistedUiFlagsToCookie` were deleted, and the `oxlint-disable` went with
them. (`readFromCookie` still _reads_ `document.cookie`; the rule only bans the
write.)

- **Shared payload shape** — `PersistCookieEntry` (`packages/ui/src/routing/`)
  is the one client-submit entry type. `buildPersistCookieEntry` builds a
  cookie-only entry (empty `searchParam*`, so the action responds `204` and
  `shouldRevalidatePersistCookieAction` skips the loader refetch).
- **`fetcherKey` per concern** — the primitive takes a stable `useFetcher` key
  (`persist-table-state`, `persist-global-settings`, `persist-column-sizing`,
  `persist-table-ui-flags`, `persist-theme`) so a newer submit supersedes an
  in-flight one → last-write-wins, the ordering the old synchronous
  `document.cookie` write had for free.
- **Effect/purity split** — each concern is a thin action hook over a pure
  builder: `usePersistColumnSizingAction` + `buildColumnSizingCookieEntry`
  (replacing `persistColumnSizing`) and `usePersistTableUiFlagsAction` +
  `buildUiFlagsCookieEntry` (replacing `persistTableMetaUiState`). The builders
  reuse the existing pure serializers (`serializeStateSlice`,
  `getPersistedUiState`).
- **Theme is the one exception to the hook** — `setThemeCookie` still submits
  with a router-free `fetch` (not `usePersistCookieAction`) because
  `ThemeProvider` can render outside a data router (e.g. in isolated component
  tests) where a fetcher hook would throw. It shares the same endpoint and the
  same `buildPersistCookieEntry` payload shape, so it is not a fourth divergent
  path.

## Consequences

- Drawer toggles and drag-end column resizes now issue a `POST /_action/persist-cookie`
  (`204`, no revalidation) instead of a synchronous `document.cookie` write. On
  offline/error the cookie is not set, but the change still lives in the client
  store for the session — identical to how filters/theme/global-settings already
  behaved. Frequency is safe: sizing persists only on drag-end (the per-frame
  path never persisted), and drawer flags are discrete UI events.
- `packages/ui` carries zero lint suppressions again; the `document.cookie`
  write is gone rather than relocated.
- The client storage layer (`utils/storage/`) is read-only now: `readFromCookie`,
  `getAppScopedCookieKey`, and the pure `parseCookies`/`buildCookieString`.
- The three-divergent-paths anti-pattern is resolved; the worked example in
  `.claude/rules/react-components.md` was updated to describe the consolidated
  path.
