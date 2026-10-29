---
'@lcabrera/ui': minor
---

`Table` renders from an array of rows or a promise, with or without a router, and `StaticTable` is removed.

- `Table` requires `columns` and takes one data input, `response`. `response` is a value or a promise of one. A promise shows the table's skeleton until it resolves. An array given with no `dataSelector` is the rows themselves. `Table` infers no columns; `inferTableColumnsFromJson` is a helper you can call and pass in.
- **Breaking:** a caller that rendered `Table` without `columns` now gets a type error.
- **Breaking:** the data props are typed as one of two shapes. With `dataSelector`, `response` is a value or a promise of the shape it reads, and `dataTotalSelector`, `dataErrorSelector` and `onLoadMore` may accompany it. Without `dataSelector`, `response` is an array of rows or a promise of one, and those three props are not accepted. `TableLayoutProps` pairs `dataPromise` with its selectors the same way. A selector given an array of rows, or a non-array response with no selector, is now a type error instead of a runtime throw or an empty grid.
- `TableProps` no longer carries `hasMore` and `isLoadingMore`, which `Table` never read.
- Outside a `TableLayout`, a `Table` holding rows in memory mounts its own table providers, so inside another grid it still renders its own columns and keeps its own state. Under `TableLayout`, it uses the layout's providers and persistence. A `Table` read through selectors mounts them only when none are above it. In both cases the notification and global-settings providers are added if missing.
- Outside a `TableLayout`, rows are held in memory and sorted and filtered in the browser, whether they came as an array or through a `dataSelector`. There, the table writes nothing to a cookie or a URL for them, and none of their interactions needs a router mounted.
- Persistence now comes from `TableLayout` only. The layout provides one cookie submitter each for table state, column sizing and UI flags, and the persist actions read them from context. Under `TableLayout`, a sort, filter or column change persists as before. Elsewhere it applies in memory and nothing is submitted.
- The empty state offers Retry only under `TableLayout`, where there is a loader to revalidate.
- `Table` is exported from the root barrel.
- `StaticTable` is removed. It was never on the root barrel or an `exports` subpath, so only a deep import reached it. Render `Table` with `columns` and `response={rows}` instead.
- `react-router` remains a required peer because the package's modules import it. A `Table` given an array of rows does not need a router mounted.
