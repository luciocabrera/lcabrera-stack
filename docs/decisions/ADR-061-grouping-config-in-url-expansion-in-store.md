# ADR-061 — Grouping configuration is URL state; expansion is client state

- **Status:** Accepted
- **Date:** 2026-08-12
- **Scope:** `@lcabrera/ui` (the Table store and the routing/persistence path), the grouped-read routes in `apps/react-router`
- **Issue:** #553 — blocks #561. It also blocked #557, which was resolved by #612 while this ADR was in draft; the outcome is recorded below rather than left open.
- **Related:** ADR-010 (the persist-cookie flow this rides), ADR-056 (the generic table route data path), ADR-058 (grouping legality), ADR-059 (the grouped SQL this config drives), ADR-009 (loader-crossing data is plain and serializable)

## Context

Table state in this repo never moves through `useSearchParams` or `useSubmit`. It
moves: action hook →
[`usePersistTableStateAction`](../../packages/ui/src/components/Table/contexts/TableConfig/columns/actions/hooks/usePersistTableStateAction.hook.ts)
→ a fetcher POST to `/_action/persist-cookie` →
[`persist-cookie.action.ts`](../../packages/ui/src/routing/actions/persist-cookie.action.ts),
which writes `Set-Cookie` headers and then branches: it returns a `redirect` when
the requested search-param updates actually changed the URL, and `204` when they
did not.
[`shouldRevalidatePersistCookieAction`](../../packages/ui/src/routing/actions/shouldRevalidatePersistCookieAction.util.ts)
is wired on every table route and does exactly one thing — it suppresses the
loader revalidation React Router would otherwise run after the `204` case.

The URL-bearing slices already use this: `buildPersistencePayload.util.ts` emits
`searchParamKey: 'filters'` and `searchParamKey: 'sorting'`, whose values are
compact JSON (`serializeSortingToURL` turns a sorting array into `{"name":"asc"}`).
The cookie-only slices — sizing, pinning, order, visibility — carry no
`searchParamKey` at all, so they never redirect.

Row grouping introduces two pieces of state with opposite requirements:

- **Grouping configuration** — which keys, which mode, which aggregates — changes
  the generated SQL (ADR-059), so the loader must re-run when it changes.
- **Expansion** — which group rows are open — changes nothing server-side. The
  grouped result set is already fully materialized by the time it reaches the
  client; expansion filters an array that is already in memory.

## Problem

Putting both in the URL fires a full navigation and a loader revalidation on
**every expand and collapse**. Putting neither there makes a grouped view
unshareable and unrestorable, which is most of what an analytical view is for.

The apparent middle path — put expansion in the URL and suppress the
revalidation — does not work against the gate that exists. Read the action and
the `shouldRevalidate` together: the suppression keys off `actionStatus === 204`,
and an expansion change genuinely _does_ change a param, so
`applySearchParamUpdates` reports `changed`, the action returns `redirect`, and
`defaultShouldRevalidate` correctly honours it. Making expansion not revalidate
therefore requires a **second, param-diffing** `shouldRevalidate` — new machinery
built to undo a problem the split avoids for free.

## Options considered

1. **Both in the URL.** Rejected: a navigation per expand/collapse, plus a real
   ceiling — expansion state under a cube at the depth cap is not small, and the
   payload shares a length budget with the rest of the persisted state.
2. **Both in the client store.** Rejected: a grouped view stops being linkable,
   and the loader cannot see the configuration it must generate SQL from.
3. **Configuration in the URL, expansion in the store. `Chosen.`**
4. **Configuration in the URL, expansion in `sessionStorage`.** Held as the named
   escape hatch if the reset cost proves unacceptable — but it is not free. At the
   time of writing the repo has no `sessionStorage` reader:
   `collectPersistedStateSlices.util.ts` is written to serve one and its doc
   comment says so, yet its only consumer is `readPersistedStateFromCookie`. This
   option means building that reader, not reusing it.

## Decision

**Grouping configuration lives in the URL** as a `grouping` search param, in the
same compact-JSON style as `sorting` and `filters`, riding the **existing**
persist-cookie flow with `searchParamKey: 'grouping'`. No new mechanism, no new
route, and the existing `MAX_COOKIE_ENTRY_VALUE_LENGTH` guard in
`usePersistTableStateAction` already bounds it.

**Expansion lives in the Table store**, keyed by **group path** — the stable tuple
of a group's key values — never by row index.

The grouping slice belongs on the **config context, not the data context**. Per
[`contexts/ARCHITECTURE.md`](../../packages/ui/src/components/Table/contexts/ARCHITECTURE.md),
`TableConfigProvider` sits outside the Suspense boundary and is stable across data
fetches, while `TableDataProvider` sits inside it and is re-created on every
navigation. Expansion state placed on the data context would be wiped before the
path re-application meant to restore it could run.

**Revalidation logic is unchanged.** `shouldRevalidatePersistCookieAction` stays
exactly as it is: a configuration change alters a param, so the action redirects
and the loader re-runs; expansion never touches the URL, so it never revalidates.
That is the payoff — no second `shouldRevalidate` is written.

### The remount key, and how it was resolved

The design that produced this decision proposed extending a remount key returned
by `createTableRouteLoader` so a grouping change would remount the Suspense
boundary "like a sort change". **That key was consumed by nothing.** It was
produced by the loader factory and read by no consumer of table loader data, and
no JSX `key` was ever written from it. What else would explain a working remount
is React Router applying the field automatically — but React Router does not read
a loader field named `key`, and a JSX key must be written explicitly.

It was **deleted, not wired**, by #557 (merged as #612). This decision never
depended on which way that went, and it is now settled:
[`createTableRouteLoader.util.ts`](../../packages/ui/src/routing/loaders/createTableRouteLoader.util.ts)
returns `columnsState`, `dataPromise` and `metaState` and nothing else. Remounting
happens because `TableDataResolver` calls `use(dataPromise)` and the loader hands
back a fresh promise reference per navigation, so the boundary re-suspends on its
own. What replaces the field in the tree is a test rather than a value — the
factory's suite pins both the exact returned key set and that two invocations
yield two distinct `dataPromise` references.

The deleted key also concatenated two params without a delimiter, so distinct
states collided. Adding grouping as a third would have inherited and widened that
defect.

## Consequences

**The cost, stated plainly: expansion resets on revalidation.** Any grouping,
sort or filter change redirects, re-runs the loader, and re-creates the data
context — and expansion does not survive a fresh dataset by itself.

It is mitigated, not hidden. Because expansion is keyed by group path rather than
row index, it is **re-applied by path** after a refetch. Sorting reorders rows
without changing any group's key values, so expansion survives a sort change
entirely; most filter changes preserve the paths that remain. Paths that no
longer exist in the new result drop silently, which is the correct behaviour —
there is nothing left to expand.

**A grouped view is linkable and restorable; expansion is neither.** The
`grouping` param travels in a copied URL and is read back by the loader on a cold
load, alongside `sorting` and `filters`, so a recipient sees the same analysis.
Expansion does not travel and is not restored on reload — a recipient sees the
default expansion level. That is the right trade, because the shareable thing is
the analysis and not the scroll position, but it must be said out loud or it
reads as a bug report waiting to be filed.

**Streaming is unchanged.** The loader keeps returning an unawaited promise
consumed by `use()`. A slow grouped query shows the existing skeleton. Do **not**
introduce `<Await>` or `defer` to solve a grouping problem — neither appears
anywhere in this repo today, and adding one here would create a second streaming
idiom for one caller.

**A new failure mode enters through the URL.** The `grouping` param is
request-derived and reaches SQL emission, where an unrecognised aggregate token
would index a lookup map and resolve to `undefined`. The codec therefore needs an
explicit refusal contract: an unrecognised token drops the **entire** grouping
rather than degrading field by field, so a malformed param yields a flat table
instead of a half-applied query. That contract is #561's to write, not this
decision's.

## Alternatives considered

**Rejected on evidence: expansion in the URL plus a `shouldRevalidate`.** The
`204` suppression cannot fire for a param that changed — `persist-cookie.action.ts`
returns `redirect` on that branch, and the suppression's only condition is the
status. Blocking the revalidation needs a second `shouldRevalidate` that diffs
params to decide which change mattered, which is new machinery undoing an
avoidable problem.

**Rejected: expansion in the persistence cookie alongside the configuration.** The
cookie is the channel for state that must survive a reload. Expansion is
per-interaction and would rewrite the cookie on every toggle, competing for the
same bounded entry length as the state that genuinely needs to persist.

**Rejected: expansion keyed by row index.** Cheaper to store, and wrong the moment
anything reorders — a sort change would reopen a different set of groups than the
user opened. The path key is what makes the mitigation above possible at all.

## References

- [`docs/agents/planning/table-row-grouping-plan.md`](../agents/planning/table-row-grouping-plan.md) §2.6, §5 — the design session this decision came out of
- [ADR-010](../../apps/react-router/docs/decisions/ADR-010-cookie-persistence-server-action.md) — the persist-cookie flow this rides
- [ADR-056](./ADR-056-generic-table-route-data-path.md) — the loader factory whose remount key is discussed above
- [ADR-059](./ADR-059-aggregation-is-builder-generated.md) — the grouped SQL the URL configuration drives
- [ADR-009](../../apps/react-router/docs/decisions/ADR-009-serializable-filter-options-descriptors.md) — why loader-crossing data is plain and serializable
- Issues #553 (this decision), #557 / #612 (the remount key, deleted), #561 (the codec and its refusal contract)
