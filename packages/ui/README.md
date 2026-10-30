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
| `react`              | `^19.2.0` | Uses `use()`, `<Activity>` and `useEffectEvent`        |
| `react-dom`          | `^19.2.0` |                                                        |
| `react-router`       | `^8.0.0`  | Imported by the package; a mounted router is optional  |
| `@stylexjs/stylex`   | `^0.19.0` |                                                        |
| `@react-router/node` | `^8.0.0`  | **Optional** — only the `./entry/*` SSR helpers use it |

`@react-router/node` is an optional peer so a browser-only consumer is not forced
to install it.

`react-router` stays a required peer because the package's modules import it:
the app shell, the route views, `Form`, `NavLink` and the table's route-level
layout all run inside a data router. A `Table` given an array of rows does not
need one mounted; see [A table from rows](#a-table-from-rows).

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
        plugins: [['babel-plugin-react-compiler']],
        presets: [
          [
            '@babel/preset-typescript',
            { allExtensions: true, allowDeclareFields: true, isTSX: true },
          ],
        ],
      },
      include: /@lcabrera\/ui\/src\/(?!.*\.test\.).*\.[jt]sx?(\?.*)?$/,
    }),
  ],
};
```

The build has to supply `@babel/core` itself, and these preset options belong to
the older `@babel/preset-typescript` major, which matches the `@babel/core` major
that `vite-plugin-babel` peers on. On that major the example installs with no
unmet peer. `allowDeclareFields` keeps a class field declared without an
initializer, which the newer major does by default. The newer major does not
take `allExtensions` or `isTSX`. A build on it passes `{ ignoreExtensions: true }`
and adds `parserOpts: { plugins: ['jsx'] }`, because that option does not enable
JSX. It also installs the newer `@babel/core`, which leaves `vite-plugin-babel`'s
peer unmet.

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
`StatusBadge`, `Table`, `TableLayout`, `Tabs`, `Text`, `Title`, `hydrateApp`, `useNotifyOnError`, plus the
`FieldNode`, `LayoutProps`, `Pagination`, `TextElement`, `TextProps`, `TextSize`, `TextTone`,
`TextWeight`, `TitleLevel`, `TitleProps` and `TitleVariant` types.

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

### A table from rows

`Table` takes its columns and one data input, `response`. That input is either
an array of rows or a promise of one. There is no loader and no router.

```tsx
import type { TableColumn } from '@lcabrera/ui/components/Table';

import { Table } from '@lcabrera/ui';

const columns: readonly TableColumn<Order>[] = [
  { dataType: 'string', key: 'reference', label: 'Reference' },
  { dataType: 'currency', key: 'orderTotal', label: 'Order Total' },
  { dataType: 'date', key: 'placedOn', label: 'Placed On' },
];

export const Orders = ({ orders }: { readonly orders: readonly Order[] }) => (
  <Table columns={columns} response={orders} />
);
```

`columns` is required because it is the table's metadata: the labels, the data
types and formats, and what can be sorted, filtered or resized. Pass a promise
instead of the array, `response={fetchOrders()}`, and the table shows its
skeleton until the rows arrive. A promise of some other response shape works
too: give the table a `dataSelector` that reads the rows out of it.

For rows whose shape you do not know in advance, the
`inferTableColumnsFromJson` helper builds a column list from the rows. It takes
one column per key, labels it from the key (`orderTotal` becomes `Order Total`)
and types it from the values. It is an option you call yourself, not something
the table does for you:

```tsx
import { Table } from '@lcabrera/ui';
import { inferTableColumnsFromJson } from '@lcabrera/ui/components/Table/utils/inferTableColumnsFromJson.util';

const columns = inferTableColumnsFromJson({ rows });

<Table columns={columns} response={rows} title='Rows' />;
```

When no `TableLayout` sits above it, a `Table` keeps its rows in memory,
whether it was given an array or a response read through `dataSelector`. Sorting, filtering, resizing, pinning
and scrolling all run on them in the browser, and the table writes nothing back
to a URL or a cookie. Such a table mounts its own table providers, so it renders
the same inside another grid as on its own. It also adds the notification and
global-settings providers if those are missing. Under `TableLayout`, the
layout's providers and persistence are used instead. Grouping and drill-down
need a server, so they belong to `TableLayout`.

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

`TableLayout` is also where persistence lives. Inside it, a sort, a filter or a
column change is written to a cookie and to the URL through the
`/_action/persist-cookie` route, and the loader reads it back when it builds the
next page.

`dataPromise` is passed **unresolved** — the table suspends on it, so the shell,
header and skeleton stream to the browser before the rows exist. `onLoadMore` is
what infinite scroll calls as you approach the end of the loaded range.

### A grid on a Postgres table, by name

Name a schema, a table, its columns and its primary key, and the grid filters,
sorts, groups and pages against it. There is no grid component to learn for
this: the reader from `@lcabrera/server` describes the table as a **source**,
`createTableRouteLoader` takes that source as a setting, and `TableRouteView`
reads its next pages from the path the source names. The query parameters
travel between the two ends through `@lcabrera/api` and are parsed by
`@lcabrera/server`, so your code writes neither half.

```ts
// app/routes/orders/.server/orders.source.ts — server-only
import { createTablePageReader } from '@lcabrera/server/table-page/create-table-page-reader.util';

export const orders = createTablePageReader<Order, 'id'>({
  pagePath: '/orders/page',
  primaryKey: 'id',
  target: {
    allowedColumns: ['id', 'country', 'placed_on', 'total'],
    schema: 'sales',
    table: 'orders',
  },
});
```

```ts
// app/routes/orders/orders.loader.ts
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import { orders } from './.server/orders.source';

export const loader = createTableRouteLoader<Order, OrdersPage>({
  appId: 'my-app',
  columns: COLUMNS,
  persistenceKey: 'orders',
  source: orders.source,
  title: { plural: 'Orders', singular: 'Order' },
});
```

```tsx
// app/routes/orders/Orders.component.tsx
import { TableRouteView } from '@lcabrera/ui';

export const Orders = () => <TableRouteView<Order, OrdersPage> />;
```

Mount `orders.pageLoader` as the `loader` of a resource route at `pagePath`
(`route('orders/page', 'routes/orders-page.ts')` in `routes.ts`). The source
turns on server-side filtering, keyset paging and grouping; a key in the
route's `meta` overrides any of them. Every other `createTablePageReader`
setting — page sizes, the fallback order, the grouped-row ceiling — has a
default, and passing `fetchPage` and `tableName` instead of `source` still
works for a page that does not come from one table.

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
