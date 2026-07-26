# @lcabrera/ui

## 0.2.0

### Minor Changes

- ff2c9cb: **Breaking:** `AppProviders` reads the root loader's `theme` and `globalSettings`
  itself, and loses the `initialTheme` and `globalSettings` props that used to
  carry them. It is the only component that consumed those values, so a caller
  reading them existed purely to name them again — the same call
  `PATTERNS.md` §"Thin Shell + Self-Connected Delegates" makes everywhere else in
  the package.

  Nothing changes for an app on `RootComponent`, which is where this seam lived.
  A hand-composed root drops the two props:

  ```tsx
  // before
  <AppProviders appId={APP_ID} globalSettings={globalSettings} initialTheme={theme}>

  // after — AppProviders reads both from the root loader
  <AppProviders appId={APP_ID}>
  ```

  `useLoaderData` returns `undefined` for a route with no loader, so a root route
  without one still falls back to `defaultTheme` rather than failing. The loader's
  shape is unchanged: `getRootLoaderData` (`@lcabrera/ui/routing/shared`) already
  returns a superset of what is read.

  The type describing that shape moved with the read and was renamed to match its
  new owner — `RootComponentLoaderData`
  (`@lcabrera/ui/components/RootComponent/RootComponent.types`) is now
  `AppProvidersLoaderData`
  (`@lcabrera/ui/components/AppProviders/AppProviders.types`). Neither name is
  exported from the package root.

- fbf9d05: `dataTotalSelector` may now return `undefined`, and the Table keeps the total it
  already holds when it does. The total of a filtered set cannot change within a
  scroll session, so re-counting it on every load-more page is work with a known
  answer — a server can now count once, on the first page, and omit it thereafter.

  Existing selectors are unaffected: returning a `number` (including `0`) still
  sets the total exactly as before, and a table with no selector still falls back
  to the number of loaded rows.

  `Pagination` also gains an optional `lastRow` and a `TData` type parameter
  (defaulting to `unknown`, so a bare `Pagination` still means what it did).
  `onLoadMore` now receives the last row the table holds, which is what a keyset
  data source needs to resume from — `skip` cannot express "resume after this
  row", and only the consumer knows which of the row's fields make up its sort
  key. Prefetched pages carry the same anchor, so they stay in step.

- ada5115: **Breaking:** the application navigation sidebar is now permanent. `AppNavigation`
  always renders as a pinned `<aside>`, so the pin/unpin toggle, the close button
  and the floating launcher rail are gone, along with the `defaultIsPinned` prop
  and the `navigation.pinned` global preference (its Settings → Navigation section
  included).

  Primary navigation is the one control that must never be more than a click away,
  and unpinning could leave a route with no visible way back — the launcher was a
  second affordance existing only to undo the first. Collapsing still works and is
  the supported way to reclaim horizontal space: the panel narrows to an icon rail
  instead of disappearing.

  Removed from the public surface: `GlobalNavigationPinnedPreference`,
  `NAVIGATION_PINNED_PREFERENCE_OPTIONS`, `useGetGlobalNavigationPinnedPreference`,
  and the `pinned` field of `GlobalNavigationPreferences`. A stored settings cookie
  that still carries `navigation.pinned` is not an error — the field is ignored on
  read, so existing users keep their collapsed/size preferences and simply get the
  docked sidebar.

  `SidePanel`'s own `isPinned` prop is untouched; the Table settings drawer still
  pins and unpins as before.

- b58fb6b: Add `RootComponent` — the whole root route of a consuming app in one component.
  It reads the root loader's data, composes `AppProviders` and renders `AppShell`,
  so an app supplies only what genuinely depends on the app: `appId`,
  `defaultTheme`, `getNavigationItems`, `isAuthEnabled` and an optional
  `logoutRoute`. Same reasoning as `hydrateApp` and `createHandleRequest` one layer
  down — the root was the last seam every app had to reproduce correctly before
  the shell would work at all.

  **Breaking:** the navigation subtree no longer drills consumer configuration
  through components that never read it. `AppShell` and `AppNavigation` lose
  `getNavigationItems` and `sessionActions`, and the `NavigationSessionActions`
  render-prop type is gone. Both values now travel through the new
  `AppConfigContext` (`@lcabrera/ui/contexts/AppConfigContext`), which also carries
  `isAuthEnabled` and `logoutRoute`.

  Migrating a hand-composed root — either adopt `RootComponent`, or wrap the shell:

  ```tsx
  <AppConfigProvider
    getNavigationItems={getNavigationItems}
    isAuthEnabled
    logoutRoute='/logout'
  >
    <AppProviders appId={APP_ID}>
      <AppShell />
    </AppProviders>
  </AppConfigProvider>
  ```

  The session control now ships with the package. An app that passes
  `isAuthEnabled` gets a logout control in the navigation footer, POSTing a
  `<Form>` to `logoutRoute` (default `/logout`) — it no longer has to write one and
  pass it in. It also picks up the navigation's density preference, which the
  hand-written controls did not.

  `AppConfigContext` carries a plain value rather than a store: none of it changes
  for the lifetime of the app, so there is nothing to subscribe to. See ADR-053.

- f82008a: **Breaking:** the Table renders **square corners by default**. The
  `borderRadius.lg` it always applied to its outer card is now opt-in behind a new
  `isRounded` meta flag, so a table drops into a surrounding card, panel or split
  pane without a rounded edge floating inside a square one — the case that
  previously had no answer short of overriding the package's styles.

  Consumers that want the previous look pass the flag through `metaState`:

  ```tsx
  // before — always rounded
  <TableLayout columnsState={columnsState} metaState={{ persistenceKey: 'orders' }} />

  // after — opt in to keep the rounded card
  <TableLayout
    columnsState={columnsState}
    metaState={{ isRounded: true, persistenceKey: 'orders' }}
  />
  ```

  `isRounded` joins `isBordered` and `isStriped` as a presentation flag on
  `TableMetaState`, readable anywhere in the tree via the new
  `useGetTableIsRounded` selector (`@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors`).
  It is not persisted to the cookie: it is a consumer-chosen layout decision, not
  a user preference the table lets you toggle at runtime.

### Patch Changes

- Updated dependencies [fbf9d05]
  - @lcabrera/api@0.2.0

## 0.1.1

### Patch Changes

- 287eb48: Add and update package READMEs.

  npm renders `README.md` as the package page, and `@lcabrera/api`,
  `@lcabrera/server` and `@lcabrera/ui` had none — all three pages were empty. Each
  now covers what the package is, how to install it, every subpath export, and
  worked examples.

  `@lcabrera/ui`'s leads with the constraint a consumer hits first: it ships
  TypeScript source rather than a compiled bundle, so the bundler must compile it
  and run StyleX over it.

  `@lcabrera/utils`'s install step told readers to use `workspace:*`, which only
  resolves inside this repo; its export table had also drifted four entries behind
  the `exports` map.

  A README only reaches npm with a release, so this is a patch across all four.

- Updated dependencies [287eb48]
  - @lcabrera/utils@0.1.1
  - @lcabrera/api@0.1.1

## 0.1.0

### Minor Changes

- First public release.

  `@lcabrera/ui` ships React 19 components — Table, Form, Modal, Tooltip and the
  rest — styled with StyleX and built for React Router 7 loaders and actions.
  `@lcabrera/api` is the browser-safe fetch layer, `@lcabrera/server` the Node-only
  Postgres and crypto helpers, and `@lcabrera/utils` the pure helpers underneath
  both.

  These target one stack deliberately: React 19, React Router 7, StyleX, the React
  Compiler, and `pg` on the server. They are not framework-agnostic and do not try
  to be.

  `api`, `server` and `utils` are published as compiled `dist` with type
  declarations. `ui` ships TypeScript source on purpose — StyleX derives every
  custom-property name from the source path, so a consumer's own StyleX plugin has
  to compile it.

### Patch Changes

- Updated dependencies
  - @lcabrera/utils@0.1.0
  - @lcabrera/api@0.1.0
