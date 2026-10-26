---
'@lcabrera/ui': minor
---

`Table` renders from rows alone, with or without a router, and `StaticTable` is removed.

- `Table` takes `rows` as an alternative to `response`, with `columns` and `title` optional. Without `columns` it infers one column per key with `inferTableColumnsFromJson`.
- When no table providers sit above it, `Table` mounts its own, plus the notification and global-settings providers if those are missing.
- Rows passed as `rows` are sorted and filtered in memory. The table writes nothing to a cookie or a URL for them, and none of their interactions needs a router mounted.
- Persistence now comes from `TableLayout` only. The layout provides one cookie submitter each for table state, column sizing and UI flags, and the persist actions read them from context. Under `TableLayout` a sort, filter or column change persists as before. Elsewhere it applies in memory and nothing is submitted.
- The empty state offers Retry only under `TableLayout`, where there is a loader to revalidate.
- `Table` is exported from the root barrel.
- `StaticTable` is removed. It was never on the root barrel or an `exports` subpath, so only a deep import reached it; render `Table` with `rows` instead.
- `react-router` remains a required peer: the package's modules import it, though a `Table` given `rows` does not need a router mounted.
