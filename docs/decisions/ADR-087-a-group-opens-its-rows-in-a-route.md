# ADR-087 — A group opens its rows in a route, not underneath itself

- **Status:** Accepted
- **Date:** 2026-08-24
- **Supersedes:** [ADR-079](./ADR-079-drilling-from-a-group-to-its-rows.md) — the inline drill, its bounded page, its hand-off row and its per-group fetch state
- **Scope:** `@lcabrera/ui` — `src/components/Table/` group rows, expansion and the grid's public props; `apps/react-router` — the enterprise-orders routes
- **Issue:** #870 — parent epic #547
- **Related:** [ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md) (a route declares its endpoint's capabilities on loader meta), [ADR-068](./ADR-068-a-refused-read-is-rendered-data-not-an-exception.md) (a refused read is rendered data, not a status), [ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md) (the grid has exactly one tab stop), [ADR-082](./ADR-082-the-olap-seam-lives-in-the-packages.md) (the OLAP seam lives in the packages), ADR-009 in the showcase's own home (a function does not survive the loader boundary)

## Context

ADR-079 gave a group row a chevron that fetched **one bounded page** of its rows
and spliced them underneath it, with a hand-off row saying how many were not
shown. Everything that decision reasoned about held. What it could not fix is
that the answer to "show me this group's orders" was permanently truncated: the
page never paged again, and the hand-off navigated away from the grouped view to
get the rest.

The cost of that shape was not the fetch. It was the state around it: a
four-member status per group, chrome rows that are neither summary nor data
occupying real height in the virtualized row array, a marker field parallel to
the group marker, and a splice performed inside the same loop that builds the
row/meta pair the focus model indexes by.

That last part is where it broke. #887 was a `TypeError` on the render path that
emptied the whole table on the first chevron click, and it took three composing
defects to produce: a per-row field dropped on the way to the cell descriptor,
two row classifiers that failed **open** so a marker-carrying row was read as
data, and a row-id resolver that threw rather than degrading. None of the three
was in the drill's own logic. All three were in the machinery that existed only
because a drill spliced rows into a grid that was not otherwise built to have
rows spliced into it.

Two further problems came with the shape. The drill endpoint answered `400` on a
refusal, which contradicts ADR-068 — the client could not parse a `400` as a
page, so it threw and the named reason was discarded in a generic failure state.
And there were three entry points into one query: the SSR loader,
`/_api/enterprise-orders/paginated`, and `/_api/enterprise-orders/drill`, all
converging on `selectOrdersPage`.

## Decision

**A group's rows open in a modal route.** The innermost key of a complete group
row is a link; following it renders a full table of that group's rows over the
grouped list, at a real URL that survives a refresh and can be shared.

**1. The affordance is a link, and the route is declared as a path.**
`groupDetailsPath` on the loader `meta` replaces `isGroupDrillEnabled` (a flag)
and `onDrillGroup` (a function prop). ADR-009 forced the fetcher to be a prop
because a function cannot cross the loader boundary; a path can, so the whole
pair collapses into one declaration alongside every other capability (ADR-063).
Absent means the affordance is not offered.

**2. Only the row's own innermost level links.** Every filled key cell describes
the same group, so linking each one puts identical links on a row and leaves no
cell that means "this group" rather than "one of its ancestors".

**3. The link is not a tab stop.** `tabIndex={-1}`, with `Enter` on the focused
cell handled by `activateGridCellLink` — the same rule the chevron follows, for
the same reason: the grid has exactly one tab stop, addressed by row key plus
column key (ADR-062).

**4. The group travels as a token, not as filters.** The link carries
`group=<encodeDrillGroup(...)>` and every other search param unchanged.
Expressing the group's keys as `ColumnFilter`s looks equivalent and is not: a
key truncated to a month is a half-open range, and the filter vocabulary's
`between` maps to `gte`/`lte`, so the March group would also return an order
stamped at midnight on 1 April — a row that is a true fact about the table and
wrong under the heading above it.

**5. `toDrillRead` stays exactly where it is** (ADR-082). It still owns the four
rules that make the read correct: the view's filters inherited first and
unchanged, `IS NULL` for a NULL key, group-key and measure terms out of the sort
with the primary key appended as tiebreaker (ADR-008), and no grouping on the
read. This decision changes **who calls it**, not what it does.

**6. `/paginated` serves both, and `/drill` is deleted.** A `group` param scopes
the read; without it the read is the unscoped one it has always been. Three
entry points become two. An unreadable token is **refused**, never ignored:
`parseDrillGroup` answers `undefined` both for "no group here" and for "a group
I cannot read", so the param's presence is tested separately — without that a
mangled link falls through to the unscoped read and serves the whole table under
one group's heading.

**6b. A route that serves only one group requires the token.**
`resolveGroupRead`'s "no token means the whole set" is right for `/paginated`,
which answers both the list and one group, and wrong for a route whose every
response is titled as a group: there, a link that lost its query string would
serve the entire table under a group heading — the failure a _mangled_ token is
refused for, reached without mangling anything. `isGroupRequired` is how a route
says which of the two callers it is.

**7. A refusal is a page carrying an error** (ADR-068), so the table renders the
reason instead of the client throwing on a shape it cannot parse.

**8. A nested table writes its URL state under a prefix.** A child route shares
its parent's URL, and a table's own sort and filters travel through that URL —
`readTableLoaderStateFromRequest` reads them from the search params and nowhere
else, and `useTableRoutePage` composes load-more from what the loader returned.
So `isUrlStateNested` prefixes every param the table writes and reads with
`TABLE_NESTED_URL_STATE_PREFIX`, and the link seeds those from the list's, which
is the floor the group was computed under.

Suppressing the write instead was the first attempt and is wrong for a reason
worth recording: the param is the only channel that reaches the loader, so a
nested table that wrote nothing would show the new filter in its drawer and
serve the old rows in its grid — and page further under the stale filters too.
Nothing consulted the store it wrote to. Prefixing keeps both tables' state on
one URL, and a refresh and a shared link keep working for both.

**9. Deciding the read is the package's job, not the route's.** `resolveGroupRead`
in `@lcabrera/server` owns the whole sequence — token present or not, refuse an
unreadable one, translate, position the page — and returns either a read or a
refusal with the sentence to render. A route supplies only what nothing else can
know: its page ceiling, its tiebreaker column, and the catalogue lookup that
resolves a truncated key against its own table. The refusal messages ship with
it, so every consumer says the same thing about a subtotal.

The alternative was leaving the sequence in the app, which is where it was first
written. It read as route code and is not: every one of its branches exists for a
rule stated above, and a second app adopting grouped tables would have had to
rewrite all of them correctly to get a working link — the opposite of what a
package is for. What is left in the route is a six-line binding.

## Consequences

`@lcabrera/server` gains `resolveGroupRead` and the `OlapGroupRead*` types; the
route's own resolver drops from three files to one binding, and its tests narrow
to the two constants it supplies.

The four-member fetch state, the drill chrome rows, the `tableDrill` marker
field, the splice inside `resolveTableGroupTree`, and every util that existed to
serve them are gone. `TableGroupTreeRowMeta` loses `isDrillable`;
`hasChildren` alone decides `aria-expanded`, and a leaf group is simply not a
tree node to open. `hasTableStructuralMarker` survives with one marker instead
of two — the fail-closed property #887 needed is a property of malformed **group**
rows, not of drills, and it is kept.

A group's rows are now reachable in full, with their own sorting, filtering and
paging, at a URL. What is lost is seeing a handful of a group's rows without
leaving the summary — the inline preview ADR-079 optimised for. The modal keeps
the list underneath rather than replacing it, which is the part of that
affordance worth keeping.

**Breaking for consumers of `@lcabrera/ui`:** `onDrillGroup`, `fetchDrill` and
`isGroupDrillEnabled` are removed from the public surface, along with the drill
row types and `toGroupKeyColumnFilter`. A route that declared them gets a
compile error rather than a silently inert affordance.

## Alternatives considered

**Keep the inline drill and make it page.** It would have kept the chrome rows,
the per-group state and the splice — the machinery the crash lived in — and
added paging state per group on top. The truncation was a symptom; the parallel
row lifecycle was the cost.

**A plain page rather than a modal route.** Loses the reader's place in the
summary underneath, which is the thing that made them group in the first place.

**Express the group as ordinary column filters.** Tempting, because it needs no
new vocabulary on `/paginated` and makes the modal a completely ordinary table.
Rejected on the truncated-key range above, and on a second ground: group scoping
would then appear as removable filter chips, so a reader could delete the very
thing that makes the modal that group's.

## References

- ADR-079, which this supersedes
- #870 (this change), #772 and #796 (the inline drill), #887 (the render crash)
