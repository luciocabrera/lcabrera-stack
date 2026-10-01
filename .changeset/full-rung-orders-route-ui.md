---
'@lcabrera/ui': minor
---

Adds `TableGroupDetailsView`, the view of a route that opens one group's rows. It renders a dialog titled by the loader's locked filters around a `TableRouteView`, passes the URL's group token to every page `fetchPage` reads, and on close returns to `closePath` without the group or the nested view state. A fetcher from `createPaginatedFetcher` can be passed as `fetchPage` directly.

Fixes a sort, filter or totals placement chosen from a menu that closes as it submits. The redirect that carries the new state was dropped, so the loader never ran again and the rows stayed where they were. `TableLayout` now keeps the table's persistence fetchers mounted for as long as the table is.

Fixes a server process exiting on an unhandled rejection when a table route loader failed. When the grouping-capability or locked-filter resolution rejected, the page read already started was left with no handler, and its rejection took the process down. The loader still fails with the resolver's error.
