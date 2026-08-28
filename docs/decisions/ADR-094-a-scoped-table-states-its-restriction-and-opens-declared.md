---
governs:
  - server
  - showcase
  - ui
---

# ADR-094 — A scoped table states its restriction, and a view arrived at opens declared

**Status:** Accepted

**Issue:** [#1021](https://github.com/luciocabrera/lcabrera-stack/issues/1021) — parent epic [#1017](https://github.com/luciocabrera/lcabrera-stack/issues/1017)

**Relates to:** [ADR-087](./ADR-087-a-group-opens-its-rows-in-a-route.md) (a group opens its rows in a route), [ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md) (a route declares its endpoint's capabilities on loader meta), [ADR-068](./ADR-068-a-refused-read-is-rendered-data-not-an-exception.md) (a refused read is rendered data), [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) (duplicate over undeclared edges), [ADR-082](./ADR-082-the-olap-seam-lives-in-the-packages.md) (the OLAP seam lives in the packages)

## Context

ADR-087 gave a grid's group row a link to a route that renders that group's rows
as an ordinary table. Decision 4 of it is a constraint this decision inherits and
does not reopen: **the group travels as a token, not as filters.** A group key
truncated to a month is a half-open range, and the filter vocabulary's `between`
maps to `gte`/`lte`, so a filter built from such a key returns the first row of
the next month under the previous month's heading. Decision 9 put the whole
decision about that read in `@lcabrera/server`, leaving the route a binding.

Two properties of the resulting table were never decided, and both defaulted to
the wrong answer.

**A table whose read is already scoped has no way to say so.** The scoping is
real — the route resolves it from the request and the query is narrowed by it —
but every surface a reader can consult about what filters a table shows the
reader's _own_ filters, held in the columns store. A reader opening the filters
panel of such a table is told that nothing is applied. That is not an omission;
it is a false statement, and it is the one statement that is never true on a
scoped read.

**A table restores its column layout from a persistence cookie, always.** The
layout — order, pinning, sizing, visibility — is written to a cookie keyed by
`appId` and `persistenceKey` and read back by the loader on every document
request. That is right for a table a reader returns to and shapes over time. It
is wrong for a view a reader **arrives at**: a route reached by following a link
from somewhere else, looked at, and closed. There, the shape restored is the one
left behind by an earlier and unrelated visit, and the reader never expressed a
preference about this one.

## Problem

Both of these have the same failure signature, which is why they are decided
together: **the table renders something defensible-looking that is not true**,
and no gate can see it. An empty filters panel and a populated one are the same
component in the same state; a restored column order and a declared one are both
just an order. Nothing throws, nothing is logged, and the type system has no
opinion. Only a reader comparing the panel against the rows notices, and by then
they have already believed it.

## Options considered

1. **Express the restriction as ordinary `ColumnFilter`s.** It needs no new
   vocabulary and makes the panel entirely ordinary. Rejected on ADR-087
   decision 4's truncated-key range, and on a second ground of its own: a
   restriction rendered as an ordinary filter is a restriction with a remove
   button, so a reader can delete the very thing that makes the view what it is.
2. **State it in the title only.** Cheapest, and where it already was. Rejected
   because the panel is the surface a reader consults to answer "what is filtering
   this?", and leaving it saying `0` while a title says otherwise makes the two
   disagree.
3. **Add read-only entries to the existing active-filters list.** Rejected on the
   count: `Active Filters (n)` answers "how many can I take off", and an entry no
   control removes is not one of them. Mixing them makes the number wrong for
   both readings.
4. **Chosen.** A separate, read-only section of the filters panel, with its own
   heading and its own count, rendered from state the route declares.

For the layout, the options were narrower:

1. **Suppress the cookie read only.** Rejected: the write still happens, so every
   layout change costs a `Set-Cookie` and grows the header carried on every
   later request, for state nothing reads back — and the writer still reports
   success for a change nothing keeps.
2. **Suppress the write only.** Rejected: whatever an older visit left behind is
   still restored.
3. **Chosen.** One declaration governing both halves.

## Decision

**1. A table may carry a restriction it states and cannot change.**
`TableMetaState.lockedFilters` holds entries of `{ columnKey, label, value }` and
an optional `refusal`. The filters panel renders them as their own section, above
the reader's own filters, with its own heading and count, and offers no control
over them. The existing clear and reset actions write the columns store, so they
cannot reach it, and the active-filter count keeps counting only what a reader
can act on.

**2. It is a statement, never the mechanism.** Nothing derived from it narrows a
read. The read is scoped by whatever already scoped it, and no `ColumnFilter` is
produced from a restriction — ADR-087 decision 4 stands unchanged.

**3. A restriction that could not be read renders why.** `refusal` carries the
sentence; the section renders it in place of the entries. An empty list under
that heading says the rows are unrestricted, which is the opposite of what a
refused request means, so "no entries and no refusal" is not a state a caller may
produce.

**4. Both are route-declared and re-asserted unconditionally.**
`createTableRouteLoader` writes `lockedFilters` and `isColumnLayoutTransient`
into `metaState` after the persisted UI flags are spread, `undefined` included.
The UI-flags cookie is client-controlled and validated nowhere, so this is what
stops a crafted one printing a restriction the read is not under, or denying a
flag the route declared. It is the same rule `groupDetailsPath` and
`isUrlStateNested` already follow, for the same reason (ADR-063).

**5. A view arrived at rather than kept declares `isColumnLayoutTransient`, and
it governs both halves.** The loader reads no persisted column order, pinning,
sizing or visibility, and the persistence action writes none. Sizing travels with
the rest because the cookie carries the layout whole. Sorting and filters are
untouched: they travel in the URL and belong to the request.

**5b. The write half selects on what an entry writes, not on what it is.** A
persistence entry is declared as a state-slice write, a URL write, **or both**,
so suppressing the slice half by discarding every entry that carries a slice
takes a live URL param down with it — silently, and with a success notification
over a write that did not happen. The transient path therefore keeps the entries
that write a param and strips the slice half off each. This is the same mistake
as 6b in a different vocabulary: reading a declared set of shapes partially, and
being right only about the shapes this repository happens to build. A published
package has consumers that build the others.

**6. Resolving a group restriction is the package's job, not the route's.**
`resolveGroupRestriction` in `@lcabrera/server` reads the token out of the search
params, resolves each key's label against the caller's declared columns, and
formats a truncated key at its granularity. A route supplies only what nothing
else can know: its columns, whether a token is mandatory, and the catalogue
lookup against its own table. The lookup is **injected** rather than called,
for the same reason the grouping-capability resolver already is: it reaches a
database, and the package that renders the panel is client-safe and may not
(ADR-038).

**6b. It refuses on the same conditions as the read, and says the same thing.**
The two resolvers answer one request, so a reader must never be shown a refusal
by one surface and a restriction by the other. Both test the param's presence,
then `parseDrillGroup`, then `resolveDrillRefusal` — which already answers every
refusal that is a property of the row and the applied keys alone, needing no
filters, no sort and no catalogue lookup — and both draw their sentence from one
map. Sharing the vocabulary is not enough on its own: the first implementation
imported the map and still handled only two of its five reasons, so a subtotal
was refused by the read and described as a restriction by the panel, and a grand
total produced neither entries nor a refusal — the state decision 3 forbids. What
holds it now is a **contract test** that drives both resolvers over the same set
of requests and asserts they agree on whether the request is refused and on the
sentence; it fails on exactly that gap.

**7. A view reached by a link is left by rebuilding a URL, not by going back.**
Closing such a view drops the params that scope it and keeps every other, rather
than calling the router's history-back. Going back assumes there is an entry to
return to, and the whole point of a shareable link is that it can be opened in a
fresh tab where there is not; there, back leaves the reader somewhere else
entirely or nowhere. Rebuilding also states what is being dropped, which is what
lets a scoped view take its own state with it instead of leaving it on the URL
the reader returns to.

**8. The scoping travels one way only: read from the URL, forwarded verbatim.**
A view arrived at holds no source row — the link may have been pasted — so the
request is the only statement of what scopes it, and every surface reads it from
there. Where the token has to be passed on, it is passed as received rather than
re-encoded from its parsed parts: re-encoding is a second chance to get wrong
what was already right, and it can only ever produce the same string or a worse
one.

**9. The shape crosses the package boundary structurally.** `@lcabrera/server` is
Node-only and `@lcabrera/ui` is client-safe, so neither may import the other's
type. `GroupRestrictionStatement` and `TableLockedFilters` are declared
separately and are structurally identical, which is ADR-039's pattern and its
stated cost.

## Consequences

The filters panel gains a section that most tables never render, and every
consumer of `@lcabrera/ui` gets the vocabulary whether or not it has a scoped
route. A table declaring nothing behaves exactly as before.

`isColumnLayoutTransient` takes column **sizing** with the order, pinning and
visibility. A reader who widens a column in such a view loses that width on
close, and there is no way to keep one half of the layout and drop the other —
the cookie is written and read as a whole. That is a real cost of deciding this
at the layout's granularity rather than per slice, and per-slice control is not
offered because nothing has needed it.

A restriction is stated and never explained: the panel says what scopes the rows,
not how to remove it. Leaving the view is the only way, and the panel does not
say so. That is deliberate — the alternative is a control that looks like it
removes a filter and instead navigates away — but it is a gap a reader can fall
into.

Two structurally identical shapes now describe one thing, one per package. They
can drift, and nothing but a consumer compiling against both would notice. That
is the standing cost of ADR-039 and is accepted here on the same grounds.

The refusal vocabulary is now shared by two resolvers, and a reason added to it
has to be handled twice. Nothing in the type system says so — the map is total
over the union, but a resolver may still narrow which members it forwards, which
is exactly how the first implementation shipped a gap. The contract test is the
only thing standing between that and a panel contradicting the grid, so a new
refusal reason means a new row in it.

## Alternatives considered

**Leave the resolution in the route.** It is where it was first written, and it
reads like route code. It is not: every branch of it exists for a rule stated
above — refuse rather than ignore, refuse an absent token where one is required,
never render a refusal as an empty list, format a truncated key at its
granularity — and a second consumer adopting a scoped table would have had to
rederive all four correctly to get a panel that does not lie. The test applied
was the one that decides every such call here: would a consumer implementing this
feature have to write it again? It would, identically, so it belongs in the
package. What is left in the route is the columns, one flag and one lookup.

**Give the restriction its own store rather than putting it on the meta.** It is
per-request, route-declared, serializable and never mutated by the client —
which is what `metaState` already is. A store would add a provider and a
subscription for state nothing writes.

**Let the app compose the meta itself, after the loader factory returns.** It
works and needs no package change. Rejected on decision 4: the factory is the
one place that spreads the client-controlled UI-flags cookie, so it is the only
place that can guarantee a crafted cookie cannot seed a restriction on a table
whose route declared none.

## References

- [#1021](https://github.com/luciocabrera/lcabrera-stack/issues/1021), and the
  measurements and reproduction behind it
- ADR-087, whose decisions 4, 6b and 9 this builds on and does not amend
