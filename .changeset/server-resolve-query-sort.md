---
'@lcabrera/server': minor
---

`@lcabrera/server` gains `resolveQuerySort`
(`@lcabrera/server/sort/resolve-query-sort.util`) and the `ColumnSort` shape it
accepts (`@lcabrera/server/sort/sort.types`) — the sort half of the boundary
`filters/` already owns for column filters.

Every endpoint built on `selectRows` has to bridge the same gap: a paginated
request carries `{ columnKey, direction }` rules, and the query builders take
`{ column, direction }`. Renaming that is two lines, which is exactly why each
new endpoint rewrote it, and why the interesting half kept being left out.

The interesting half is the **non-empty guarantee**. A paginated read with no
ORDER BY leaves row order unspecified, so pages repeat and skip rows whenever
the planner changes its mind between requests — it presents as data corruption
and reproduces only under load. `resolveQuerySort` substitutes the endpoint's
fallback when the request sorted by nothing, and throws when that fallback is
itself empty, at the one place that can see both inputs. A hand-rolled `.map()`
returns `[]` and reaches the database.

`ColumnSort` is restated rather than imported from `@lcabrera/api`, whose
`PaginatedSort` is structurally the same: both it and `@lcabrera/ui` are
browser-safe, this package's graph includes the Postgres driver, and an import
across that line is the edge ADR-038 splits the packages to prevent and ADR-039
refuses to reintroduce. Structural typing means a sort built by either package
is assignable with no adapter. The one deliberate difference is that `direction`
is required here — an ORDER BY entry has nothing to emit without it, so the
default belongs where the request is parsed.

Distinct from `@lcabrera/ui`'s `toQuerySort`, which sanitizes a typed
`SortingState` on the client and may legitimately yield an empty sort; this is
the server-side edge that must not.

Additive only — no existing export changes.
