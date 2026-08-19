# ADR-085 — A route-declared grouping makes "explicitly ungrouped" a state the URL must carry

- **Status:** Accepted
- **Date:** 2026-08-19
- **Scope:** `@lcabrera/ui` — the loader factory's default grouping, the lock, and the totals-placement channel
- **Issue:** #578 — grouping presets and configurable totals placement
- **Narrows:** [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) — grouping still travels in the URL; this records the one state that URL could not previously express, and adds a second setting that does not travel there
- **Related:** [ADR-010](../../apps/react-router/docs/decisions/ADR-010-cookie-persistence-server-action.md) (the channel the placement persists in), [ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md) (why the lock is route-declared), [ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) (the totals being placed)

## Context

#578 asks for two things that look unrelated and turn out to share a problem:
a route that can declare its own grouping, and a user-settable position for the
totals. Each one runs into a channel that cannot carry it.

### A default grouping collides with how "no grouping" is written

`serializeGroupingToURL` returns `undefined` for an empty key list, and
`applySearchParamUpdates` deletes a param whose value is empty. So clearing the
grouping **removes** the `grouping` param, and the serializer says why:

> a `grouping={"keys":[]}` in a shared link would say "grouping considered and
> switched off", which is not a state this table has.

That was true, and it stops being true the moment a route declares a default,
because the loader has to read _something_ as "apply the default". The only
candidate is an absent param — and an absent param is exactly what clearing
produces. The two states become indistinguishable.

The failure is not the mild one it first looks like. It is not "the default
comes back on reload": every navigation that writes any other param re-runs the
loader, so applying a filter to a table the user had ungrouped would silently
re-group it under them, with no action of theirs that names grouping at all.

### Totals placement fits neither existing channel

The placement has to satisfy two criteria at once:

- **it must reach the emitted SQL**, because it is the direction of the
  `GROUPING()` term in the `ORDER BY` (ADR-065) — nothing about it is a
  rendering concern; and
- **it must persist across sessions**, which the URL does not do.

The cookie is the persistence channel (ADR-010), but a cookie-only
`persist-cookie` entry answers `204` and `shouldRevalidatePersistCookieAction`
skips the refetch — by design, because the drawer flags it was built for change
nothing about the data. A placement written that way would change nothing on
screen until some unrelated navigation happened to re-read it.

## Decision

**1. Where a route declares a default grouping, clearing writes the empty
envelope instead of dropping the param.** `serializeGroupingToURL` takes
`keepWhenEmpty`, set from `TableMetaState.hasDefaultGrouping`, which the loader
derives from its own configuration. Routes without a default produce
byte-identical URLs to before.

**2. The default applies to an absent param only — never to a parsed empty
grouping.** `resolveLoaderGrouping` takes the raw param rather than the
deserialized state, because `null` and `{"keys":[]}` both parse to no keys and
only the raw value tells them apart. The route default is sanitized against the
route's columns exactly as a URL-supplied grouping is: it is authored in code so
it is not hostile, but a key naming a since-renamed column reaches SQL as an
identifier either way, and a preset is the one grouping nobody has to type to
run into.

**3. Totals placement travels in both channels, and the URL wins.** One
`PersistCookieEntry` already carries a cookie write and a search-param update
together, so the setting needs no change to the shared action: the cookie makes
it outlive the session, the `totals` param makes the action redirect and the
loader re-read. Where both are present the param wins — a link is an explicit
statement about one table, a cookie is a standing preference, so a shared link
opens the way its author saw it. That precedence also makes the two writes
race-free in the direction that matters: the param rides the redirect, so even
if the cookie write lands later the placement in effect is already correct.

**4. A lock covers the grouping's shape, not its measures.** `isGroupingLocked`
fixes the keys, the mode and the per-key granularity; aggregates stay editable,
because a curated grouping says how rows are grouped rather than what is
measured over them. It is resolved by `resolveTableCapabilityMeta` and spread
last, so the client-controlled UI-flags cookie cannot unlock a curated table.
`isGroupDrillEnabled` was moved into that same resolve at the same time — its
own documentation already claimed a route that does not declare it must not
offer the affordance, which the `...meta` spread alone could not guarantee.

**5. The lock is applied at every surface that reshapes the grouping**, not only
at the drawer: the add-key control, the mode control, the key list's removal and
drag-to-reorder, the granularity select, the section toolbar's Clear, and the
column-header menu's "Group by This" and "Clear Grouping". Each reads the flag
itself, as a self-connected delegate.

## Consequences

A route can hand a table a curated grouping without giving up the user's ability
to leave it, and a locked one has no surface that edits it. "Ungrouped" becomes
a state such a URL can express, at the cost of one more shape the `grouping`
param can hold — `{"keys":[]}`, which every existing reader already
deserializes to no grouping, so no link written before this stops working.

Totals placement is the first setting here that shapes the query and is stored
in a cookie. That is a genuinely new combination, and the reason it is safe is
the precedence in decision 3 rather than anything about the cookie: the URL is
what the loader acts on, and the cookie only supplies a value when the URL is
silent.

**The lock is a UI guarantee, not a security boundary.** The keys still travel
in the URL and are still sanitized and refused server-side; a user editing the
address bar on a locked table gets a different grouping. What the lock buys is
that no affordance in the product offers one — the same standing as every other
capability flag (ADR-063). A route that needs the grouping to be _enforced_ has
to pin it in its own `fetchPage`, where the URL cannot reach it.

Placement is offered only under `rollup`, since `flat` emits no total to place;
the control renders itself away otherwise, and the value is still carried so
switching modes does not lose it.
