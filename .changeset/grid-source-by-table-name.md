---
'@lcabrera/server': minor
'@lcabrera/ui': minor
---

A grid connects to a Postgres table by naming it.

`@lcabrera/server`:

- `createTablePageReader` needs only `primaryKey` and `target` (schema, table, columns). `defaultLimit`, `fallbackSort`, `groupMaxRows` and `maxLimit` are now optional, defaulting to 50 rows, the primary key ascending, 5000 grouped rows and a 1000-row ceiling. A new optional `pagePath` names where the page route is mounted.
- The reader also returns `pageLoader`, the `({ request }) => Response` handler for that page route, and `source`, the description of the table that `@lcabrera/ui`'s `createTableRouteLoader` takes.
- `table-page/to-refused-table-page.util` is exported, for a handler that calls `parseTablePageParams` itself.
- `createTablePageLoader`'s `resolvePageRead` and `createTableLoaderReads`'s `reader.selectGroupingCapabilities` are now typed by the new `TablePageReadResolution` and `TableGroupingCapabilities` types instead of through `TablePageReader`. They accept the same values.

`@lcabrera/ui`:

- `createTableRouteLoader` takes `source` in place of `fetchPage`, `tableName`, `schemaName` and `resolveGroupingCapabilities`. The source's capabilities go into `metaState` under the route's own `meta`, and its `pagePath` becomes `metaState.pagePath`. Passing both `source` and `fetchPage` is a type error. A loader that passes `fetchPage` is unchanged.
- `TableRouteView`'s `fetchPage` prop and `useTableRoutePage`'s `fetchPage` argument are optional. Without them, the next page is fetched from `metaState.pagePath`. If there is no path either, `onLoadMore` is `undefined` and the grid shows one page. Code that calls `useTableRoutePage(...).onLoadMore` directly now has to handle `undefined`.
- `TableMetaState` gains an optional `pagePath`.
