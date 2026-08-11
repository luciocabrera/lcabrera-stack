# Grouping config is URL state; expansion is client state

**Status:** Proposed

<!-- Draft — no number until adoption (see README.md). Home at adoption:
     docs/decisions/, NOT the app ADR home. ADR-048's test is "does it leave with
     CQMS?" — both candidate homes stay, so the tie-break is package-vs-app, and
     every line of this decision's code is in packages/ui. ADR-011 and ADR-012 sit
     in the app home because they predate the Table's extraction into the package;
     they are grandfathered, not precedent. -->

## Context

Table state changes in this repo never go through `useSearchParams` or
`useSubmit`. They go: action hook → `persistTableState` → a fetcher POST to
`/_action/persist-cookie` → the action returns a `redirect` when a search param
actually changed, or `204` when nothing did. `shouldRevalidatePersistCookieAction`
exists on all four table routes and does exactly one thing — it suppresses the
`204` case.

Grouping introduces two pieces of state with opposite requirements:

- **Grouping configuration** (which keys, which mode, which aggregates) changes
  the generated SQL, so the loader must re-run when it changes.
- **Expansion** (which group rows are open) changes nothing server-side. The
  grouped result is already fully materialized — expansion is filtering an array
  that is already in memory.

## Problem

Putting both in the URL fires a full navigation and loader revalidation on **every
expand and collapse**. Putting neither there makes a grouped view unshareable and
unrestorable, which is most of what an analytical view is for.

The naive fix — put expansion in the URL and suppress revalidation — does not
work against the gate that exists. `shouldRevalidatePersistCookieAction` keys off
`actionStatus === 204`, and an expansion change genuinely **does** change a param,
so the action returns `redirect` and `defaultShouldRevalidate` correctly honours
it. Making it not revalidate requires a second, param-diffing `shouldRevalidate` —
new machinery built to undo a problem that the split avoids for free.

## Options considered

1. **Both in the URL.** Rejected: a navigation per expand/collapse, and a real
   ceiling — deep expansion state at cube depth 3 is not small.
2. **Both in the client store.** Rejected: a grouped view stops being linkable,
   and the loader cannot see the config it must generate SQL from.
3. **Config in the URL, expansion in the store. `Chosen.`**
4. **Config in the URL, expansion in `sessionStorage`.** Kept as the named escape
   hatch if the reset cost proves unacceptable — tab-scoped table state already
   uses `sessionStorage` elsewhere, so the precedent exists.

## Decision

**Grouping configuration lives in the URL** as a `?grouping=` search param, in the
same compact-JSON house style as the existing sorting and filter params, and rides
the **existing** persist-cookie flow with `searchParamKey: 'grouping'`. No new
mechanism, and the existing cookie-entry length guard already bounds it.

**Expansion lives in the Table store**, keyed by **group path** — a stable tuple of
the group's key values, not a row index.

The grouping store slice belongs on the **config context, not the data context**.
The data context remounts on every navigation; expansion state placed there would
be wiped before the path re-application that is supposed to restore it could run.

**Revalidation logic is unchanged.** `shouldRevalidatePersistCookieAction` stays
exactly as-is: a grouping config change alters a param, so the action redirects and
the loader re-runs; expansion never touches the URL, so it never revalidates. That
is the payoff of the split — no new `shouldRevalidate` is written.

### The remount key

The design that produced this decision proposed extending a remount key returned
by `createTableRouteLoader` so that a grouping change would remount the Suspense
boundary "like a sort change". **That key is consumed by nothing.** It is produced
at `createTableRouteLoader.util.ts:147`, and every consumer of table loader data —
`useTableRoutePage`, `TableRouteView`, and each app route component — destructures
a fixed set that excludes it. No JSX `key` is written from it.

_The probe that could have disproved this:_ enumerate every consumer of table
loader data across `packages/ui/src` and `apps/react-router/src`. What else would
explain a working remount is React Router applying the field automatically — but
React Router does not read a loader field named `key`, and a JSX key must be
written explicitly. Remounting works today because `use(dataPromise)` re-suspends
on a new promise reference.

The key is therefore **not extended**. It is wired to a real remount or deleted
(backlog P-08), and this decision does not depend on it either way. It also
concatenates two params without a delimiter, so distinct states collide — a defect
that would have been inherited and widened by adding a third param.

## Consequences

**The cost, stated plainly: expansion resets on revalidation.** It is mitigated,
not hidden. Because expansion is keyed by group path rather than row index, it is
re-applied by path after a refetch — so it survives **sort changes entirely**
(sorting reorders rows without changing paths) and most filter changes. Paths that
no longer exist drop silently.

**Shareable URLs are partial.** Grouping, sort and filters travel; expansion does
not, so a recipient sees the default expansion level. The shared thing is the
analysis, not the scroll position. That is the right trade, but it must be said
out loud or it reads as a bug.

**Streaming is unchanged.** The loader keeps returning an unawaited promise
consumed by `use()`, so a slow grouped query shows the skeleton. Do **not**
introduce `<Await>` or `defer` — both are absent repo-wide and adding them here
would create a second streaming idiom.

**A new failure mode:** the grouping param is request-derived and reaches SQL
emission, where an unrecognised aggregate token would index a lookup map and
resolve to `undefined`. The codec must therefore have an explicit refusal
contract — an unrecognised token drops the **entire** grouping rather than
degrading field by field.

## Alternatives considered

**Rejected on evidence: expansion in the URL plus a `shouldRevalidate`.** Read
`shouldRevalidatePersistCookieAction` and `persist-cookie.action.ts` together: the
`204` suppression cannot fire for a param that changed, so this needs a second,
param-diffing `shouldRevalidate` — new machinery to undo an avoidable problem.

**Rejected: expansion in the cookie alongside the config.** The cookie is the
persistence channel for state that must survive a reload; expansion is
per-interaction and would rewrite the cookie dozens of times per session.

## References

- `docs/agents/planning/table-row-grouping-plan.md` §2.6, §5
- [ADR-010](../../../../apps/react-router/docs/decisions/ADR-010-cookie-persistence-server-action.md) — the persist-cookie flow this rides
- [ADR-009](../../../../apps/react-router/docs/decisions/ADR-009-serializable-filter-options-descriptors.md) — why loader-crossing data is plain and serializable
- Backlog entries P-04 (this ADR), P-08 (the remount key), P-12 (the codec), P-18 (the store slice)
