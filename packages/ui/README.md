# `@lcabrera/ui`

A React 19 component library built around one hard problem: a **data table that
stays responsive with tens of thousands of rows** — virtualized, filterable,
sortable, column-pinnable, resizable, with server-driven filter options and
infinite scroll. Everything else in the package grew out of making that work.

Styled exclusively with [StyleX](https://stylexjs.com), built for React Router in
framework mode, and designed so that re-renders are governed by **granular store
subscriptions** rather than by memoization.

## Install

```bash
npm install @lcabrera/ui
```

### Peer dependencies

Framework singletons are peers on purpose — as ordinary dependencies your app
would resolve a second copy of React, which breaks hooks outright.

```bash
npm install react react-dom react-router @stylexjs/stylex
```

| Peer                 | Range     | Notes                                                  |
| -------------------- | --------- | ------------------------------------------------------ |
| `react`              | `^19.0.0` | Uses `use()`, Actions, and the React Compiler          |
| `react-dom`          | `^19.0.0` |                                                        |
| `react-router`       | `^8.0.0`  | Framework mode — loaders, actions, `useLoaderData`     |
| `@stylexjs/stylex`   | `^0.19.0` |                                                        |
| `@react-router/node` | `^8.0.0`  | **Optional** — only the `./entry/*` SSR helpers use it |

`@react-router/node` is an optional peer so a browser-only consumer is not forced
to install it.

## Before you install: this package ships TypeScript source

`@lcabrera/ui` is published as **source**, not as a compiled bundle — unlike its
three sibling packages, which ship `.mjs` + `.d.mts`. StyleX resolves its style
definitions at build time, so the styles have to be compiled **in your build**,
against your theme, to be themeable and to dedupe with your own styles.

That means your bundler must:

1. **Compile TypeScript/JSX from `node_modules/@lcabrera/ui`** — most setups
   exclude `node_modules` from transpilation by default.
2. **Run the StyleX plugin over the package source.** No alias is needed for the
   package's internal imports: they use a `#ui/*` specifier declared in this
   package's own `imports` field, which every Node-compatible resolver handles.

With Vite:

```ts
import { unplugin as stylex } from '@stylexjs/unplugin';
import babel from 'vite-plugin-babel';

export default {
  plugins: [
    stylex.vite({ useCSSLayers: true }),
    babel({
      babelConfig: {
        parserOpts: { plugins: ['jsx'] },
        plugins: [['babel-plugin-react-compiler']],
        presets: [['@babel/preset-typescript', { ignoreExtensions: true }]],
      },
      include: /@lcabrera\/ui\/src\/(?!.*\.test\.).*\.[jt]sx?(\?.*)?$/,
    }),
  ],
};
```

If that is more build surface than you want, take the package as a reference
implementation rather than a dependency — the source is the documentation. A
leaf component's contract is its types; how a whole system is wired is written
up in the repository, which is where the links at the foot of this page go.

## What's in it

Import from the root barrel for the handful of top-level pieces, or from a
subpath for anything else. There is deliberately **no single mega-barrel**: a
subpath import is what keeps an unused component out of your bundle.

```ts
import { Button, Form, TableLayout } from '@lcabrera/ui';
import { Modal } from '@lcabrera/ui/components/Modal';
import { useVirtualization } from '@lcabrera/ui/hooks';
```

A component subpath resolves through that directory's `index.ts`, so it needs a
bundler's directory resolution — which this package requires in any case, per the
section above.

### Root barrel — `@lcabrera/ui`

`AppDocument`, `AppProviders`, `AppShell`, `Button`, `Form`, `JsonExplorer`,
`NavLink`, `RootErrorBoundary`, `RouteErrorBoundary`, `SectionCard`,
`StatusBadge`, `TableLayout`, `Tabs`, `hydrateApp`, `useNotifyOnError`, plus the
`FieldNode`, `LayoutProps` and `Pagination` types.

### Subpaths

**`package.json`'s `exports` is the list** — every public subpath is named there
explicitly, mapped to a concrete file. It carries no wildcard, so a path that is
not listed does not resolve: the internals really are internal, rather than
internal by convention.

Broadly: component barrels under `./components/*` (`Table`, `Form`, `Modal`,
`SidePanel`, `VirtualList`, `VirtualSelect`, `Icons`, `Card` and its parts, and
the rest), the Table's public types and utils, `./contexts/*` store providers,
`./design-system/*` tokens and the CSS reset, `./routing/*` loader and action
helpers, and `./entry/hydrateApp.util`.

Anything reachable from the root barrel needs no subpath at all.

### Hooks — `@lcabrera/ui/hooks`

`useBackNavigate`, `useClickOutside`, `useElementSize`, `useInfiniteScrollObserver`,
`useNotifyOnError`, `usePersistCookieAction`, `useResizeObserver`, `useStore`,
`useVirtualization`.

### Everything else

| Subpath                        | What it holds                                                             |
| ------------------------------ | ------------------------------------------------------------------------- |
| `@lcabrera/ui/design-system/*` | StyleX tokens, light/dark themes, a CSS reset                             |
| `@lcabrera/ui/contexts/*`      | Global settings, notifications, theme — each a store-pattern provider     |
| `@lcabrera/ui/routing/*`       | Loader/action helpers: URL state, cookie persistence, filter sanitisation |
| `@lcabrera/ui/utils/*`         | Filters, prefetch, storage, theme, URL state, a logger                    |
| `@lcabrera/ui/types/*`         | Shared type definitions                                                   |
| `@lcabrera/ui/entry/*`         | SSR entry helpers (needs `@react-router/node`)                            |
| `@lcabrera/ui/server`          | `createHandleRequest` — the SSR request handler                           |

## Usage

### A full data table

`TableLayout` is the assembled table: header, virtualized body, settings and
column drawers, filters, sorting, pinning, infinite scroll. You give it a promise
and tell it how to read rows out of the response.

```tsx
import type { Pagination } from '@lcabrera/ui';

import { TableLayout } from '@lcabrera/ui';
import { useLoaderData } from 'react-router';

export const Orders = () => {
  const { columnsState, ordersPromise, metaState } =
    useLoaderData<typeof loader>();

  const handleLoadMore = async ({ limit, skip }: Pagination) =>
    fetchOrdersPage({ limit, skip });

  return (
    <TableLayout<Order, OrdersResponse>
      columnsState={columnsState}
      dataPromise={ordersPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
      onLoadMore={handleLoadMore}
    />
  );
};
```

`dataPromise` is passed **unresolved** — the table suspends on it, so the shell,
header and skeleton stream to the browser before the rows exist. `onLoadMore` is
what infinite scroll calls as you approach the end of the loaded range.

### The app shell

`AppShell` renders the navigation chrome and the routed outlet; it takes the
navigation items from your app rather than owning them. `AppProviders` supplies
theme and global-settings state, seeded from the root loader so SSR and the
browser agree on the first paint.

```tsx
import { AppProviders, AppShell } from '@lcabrera/ui';
import { useLoaderData } from 'react-router';

export const Root = () => {
  const { globalSettings, theme } = useLoaderData<typeof rootLoader>();

  return (
    <AppProviders
      appId='my-app'
      defaultTheme='light'
      globalSettings={globalSettings}
      initialTheme={theme}
    >
      <AppShell getNavigationItems={getNavigationItems} />
    </AppProviders>
  );
};
```

`appId` scopes the theme and settings cookies, so two apps on the same host do
not overwrite each other's preferences.

### Virtualization on its own

The table's virtualization is available as a hook if that is the only part you
want. It measures the container itself and re-measures on resize, so you supply
the item height and total count and render the window it hands back.

```tsx
import { useVirtualization } from '@lcabrera/ui/hooks';

const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
  useVirtualization({
    containerRef,
    itemHeight: 36,
    overscan: 8,
    totalItems: rows.length,
  });
```

## How it is built

Four decisions explain most of the code, and they are worth knowing before you
extend anything:

- **Split contexts + external stores, not prop drilling.** Table state lives in
  `useSyncExternalStore`-backed stores split by concern, and components subscribe
  through selectors. A cell that depends on one column's width re-renders when
  that width changes — not when any table state changes.
- **The React Compiler owns memoization.** There is almost no `useMemo` or
  `memo()` here by design. Performance comes from the subscription granularity
  above, from row virtualization, and from streaming — not from hand-tuning.
- **StyleX only.** No CSS modules, no styled-components, no inline styles, no
  Tailwind. Styles are colocated in `*.stylex.ts` files and composed in a fixed
  order so overrides are predictable.
- **Client-safe by construction.** A publish gate fails the build if anything in
  this package's dependency closure reaches for `node:*`. That is why the HTTP
  helpers live in `@lcabrera/api` and the Postgres code in `@lcabrera/server`,
  rather than all three sharing one package.

The install carries the source and this page. Everything else — the per-system
write-ups of wiring that is not visible from one file (Table, Form,
VirtualSelect), the conventions shared across them, and the catalogue of every
artifact — stays in the repository and is linked below.

## Links

- [Repository](https://github.com/luciocabrera/lcabrera-stack) ·
  [this package's source](https://github.com/luciocabrera/lcabrera-stack/tree/main/packages/ui)
- [Changelog](https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/ui/CHANGELOG.md)
- [Component patterns](https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/ui/src/PATTERNS.md)
  · [Artifact inventory](https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/ui/src/INVENTORY.md)
- Companion packages: [`@lcabrera/utils`](https://www.npmjs.com/package/@lcabrera/utils)
  (pure helpers), [`@lcabrera/api`](https://www.npmjs.com/package/@lcabrera/api)
  (browser HTTP), [`@lcabrera/server`](https://www.npmjs.com/package/@lcabrera/server)
  (Node + Postgres)

MIT © Lucio Cabrera
