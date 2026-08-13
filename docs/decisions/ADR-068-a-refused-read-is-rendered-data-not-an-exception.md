# ADR-068 — A refused read is data the table renders; the menu narrows to the catalogue but never replaces it

- **Status:** Accepted
- **Date:** 2026-08-13
- **Scope:** `@lcabrera/ui` — `TablePageResponse.error`, the data store's `error`, the empty-body surface, and every grouping affordance; `apps/react-router` — the enterprise-orders route as the live consumer
- **Issue:** #642 — closes the client half of #573
- **Related:** [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md) (group-key legality comes from the pg catalogue), [ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md) (a table capability is declared once, on the loader meta), [ADR-066](./ADR-066-grouping-guard-rails-and-per-query-timeout.md) (the guard rails and the serializable error union), [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) (grouping configuration is URL state), [ADR-050](./ADR-050-server-error-translation-and-result-contract.md) (why an error class cannot cross the loader boundary)

## Context

Two independent gates decide whether a column may be a group key, and the split
is deliberate (ADR-058). The client half is `TableColumn.isGroupable`, whose
resolved default is **`true`** — the consumer's declaration, made without any
knowledge of the data. The server half is the pg catalogue: the column's real
type and its `n_distinct` statistics, resolved per request.

Nothing narrowed the first with the second. Measured against the seeded
`enterprise_orders` (500 000 rows) the header menu offered all 31 columns and
the catalogue refused 11 of them — two as `unique-ish`, nine as
`too-many-distinct`. Re-derive the split with the smoke suite named under
References; the numbers are data-dependent and will drift.

What happened on selecting one of those 11 changed twice. Before #573 the
refusal was thrown inside the streamed `dataPromise` and the user got the route
error boundary — a sanitized "Unexpected Server Error" that named neither the
column nor the reason. #573 gave the refusal a type and mapped it to a plain
union at the loader edge, so it became a **successful** response carrying
`error`. Nothing read that field. The same selection then produced an empty
table with no message at all: a loud wrong answer replaced by a silent one.

## Problem

Two failures, and they are not the same failure.

1. **The menu advertised keys the endpoint refuses.** Any affordance built from
   the declared flag alone offers them, because the declared flag defaults to
   permissive and no surface consulted the catalogue's answer — even though that
   answer was already on the client, on `TableMetaState.groupingCapabilities`
   (ADR-063), and was already being read for the _aggregate_ menu.
2. **A refusal that did arrive was invisible.** `TablePageResponse` had no slot
   for it, the data store had no field for it, and the empty body rendered one
   fixed sentence — "No records match the current view" — which is a claim about
   the filters and is simply false when the database declined the query.

Closing only the first would leave the second reachable, and this is the part
that decides the design: **the client gate cannot be complete.** The pre-flight
row bound is a property of the whole key combination rather than of any one
column, so no per-column answer predicts `estimate-too-large`; statistics go
stale between the page load and the query; and grouping configuration is URL
state that a user may edit (ADR-061). A menu that offers nothing illegal is
still a menu whose selections can be refused.

## Decision

**Both halves, with the rendering half load-bearing.**

1. **A refusal travels as data and the table renders it.**
   `TablePageResponse` gains `error?: TableResponseError` — the client-side twin
   of `@lcabrera/server`'s `SerializableDbError`, duplicated arm for arm because
   `@lcabrera/ui` is client-safe and may not import the Node-only package
   (ADR-038/039), and pinned in both directions by `groupingContract.test.ts`.
   `Table` reads it through a `dataErrorSelector` prop — defaulted on
   `TableRouteView` to `response.error`, so a route gets the behaviour without
   wiring — and seeds it into the data store, where `useGetTableDataError`
   exposes it.
2. **The empty body says which of the two things happened.** `TableEmptyState`
   became a thin shell over two self-connected delegates:
   `TableEmptyStateMessage` composes the heading from the table's own column
   label and the sentence from the endpoint, and `TableEmptyStateAction` offers
   **Clear grouping** in place of **Retry** when the refusal is a grouping one,
   because revalidating sends the same keys and is refused again. A cancelled or
   failed read keeps Retry — those can succeed on a second attempt.
3. **The heading names the column only when the column _is_ the refused key** —
   that is, for `column-not-groupable` alone. `estimate-too-large` names the
   **widest** key rather than the one just picked, `aggregate-not-legal` names an
   aggregated column, and `unknown-column` is raised for both roles, so
   "Grouping by X was refused" would be a false sentence about each. Those take a
   neutral heading and let the endpoint's sentence carry the column in its real
   role.
4. **The catalogue narrows the declared answer everywhere a group key is
   offered.** `resolveGroupKeyAvailability` composes `resolveColumnCapabilities`
   with the shipped capability: a column the catalogue refused is not offered,
   and the reason rides the disabled header-menu item, gated on the same
   condition that disables it. An **absent** capability leaves the declared
   answer standing — a route may group without shipping a map at all — and a
   **consumer opt-out wins with no reason attached**, since `isGroupable: false`
   is the table's own decision rather than anything the endpoint said.
5. **A refused key that is already applied stays removable.** Neither the depth
   cap nor a refusal disables the header item when clicking it would _remove_ the
   key, because a URL can seed a grouping the catalogue refuses today.

The behaviour is proved against the live catalogue, not a mocked map:
`groupingRefusalSurface.smoke.test.tsx` resolves the real capabilities, asserts
both a refused and a legal column exist, drives the route's real `loader` for
every refused column and asserts its `dataPromise` **resolves**, then renders the
real route component and asserts the refusal is on screen naming the column. It
also builds a **multi-key** grouping from the live estimates — every key legal on
its own, the product past the ceiling — which is the refusal no client-side gate
could have predicted, and pins that its heading blames no column.

## Consequences

- **The error boundary is no longer the refusal path, and must not become one
  again.** A route whose `fetchPage` rejects on a refusal reverts to the 500 this
  closes. The contract is: refusals resolve, unexpected failures may reject.
- **A route that reads its response with a custom `dataSelector` must supply a
  `dataErrorSelector` too**, or its refusals stay invisible. The default only
  covers responses shaped like `TablePageResponse`.
- **`TableDataState.error` is required and nullable, not optional.** The provider
  re-seeds the store with a shallow merge, so an omitted key keeps the previous
  value — an optional member would leave a stale refusal on screen after the
  navigation that resolved it. `getInitialDataState` therefore always emits the
  key.
- **The clear-grouping recovery needs a `NotificationProvider`** in the tree,
  because the grouping write path persists through `usePersistTableStateAction`.
  It is rendered only for a grouping refusal, so an ordinary empty table still
  needs nothing; `AppProviders` supplies one for every app built on the package
  root (ADR-053).
- **The duplicated error union is one more shape to keep in step.** The contract
  test is the guard, and it asserts each arm rather than only the union, so a
  widened arm fails there too.
- **The menu can still be wrong, in the safe direction only.** It narrows to a
  snapshot of the statistics taken at page load; if they move, a stale-allowed
  key is refused visibly rather than silently. A stale-_refused_ key is a column
  temporarily missing from the menu, which is why the refusal reason names what
  would change the answer.

## Alternatives considered

1. **Suppress the offending keys and nothing else.** Cheapest, and it is half of
   what shipped — but it cannot cover a refusal that depends on the key
   combination, on statistics resolved after the page loaded, or on a
   hand-edited URL, all of which then fall back to the silent empty table. It
   answers the complaint, not the defect.
2. **Render the refusal and leave the menu alone.** Also half of what shipped,
   and it satisfies the acceptance criteria on its own — but it leaves the menu
   advertising 11 of 31 columns whose only outcome is a message saying no.
   Offering an action whose sole result is an explanation is a worse affordance
   than not offering it.
3. **Sanitize refused keys out of the grouping param in the loader.** Rejected on
   the terms this repo already settled for a malformed param (ADR-061): dropping
   a key the user asked for and rendering a flat table is another silent wrong
   answer. It would also serialize the catalogue query ahead of the data query,
   which `createTableRouteLoader` deliberately overlaps.
4. **Keep throwing and make the error boundary render the refusal.** Rejected
   because a refusal is an expected outcome of a legal request, not an exception:
   routing it through the boundary discards the streamed page, the table state
   and the URL context, so the user loses the view they were in to be told which
   column to drop. ADR-066's mapping to a plain union exists precisely so this
   can be a payload.
5. **Let the table render `error.message` alone, with no heading of its own.**
   Rejected because the endpoint's sentence names the `snake_case` column
   (`"total_amount"`), which is not what the user picked from — the header said
   "Total Amount". The heading is the table's, the sentence is the endpoint's,
   and neither can be written by the other.

## References

- Issue #642 (this decision), #573 / PR #656 (the server half and the union), #568 / #641 (the walking skeleton)
- `apps/react-router/src/routes/enterprise-orders/.server/groupingRefusalSurface.smoke.test.tsx` — the live-catalogue proof, and the command that re-derives the refusal split (`vp run --filter vite-react-compiler test:smoke`)
- `apps/react-router/src/routes/enterprise-orders/.server/groupingContract.test.ts` — the duplication guard for `TableResponseError` and both refusal vocabularies
- `packages/ui/src/components/Table/TableEmptyState/ARCHITECTURE.md`
