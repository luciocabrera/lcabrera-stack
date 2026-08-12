---
'@lcabrera/ui': minor
---

**Breaking:** a table route's request-shaping capabilities are declared once, on
the loader `meta`, and no longer as props on the view (ADR-063).

`TableRouteView` and `useTableRoutePage` lose `isKeysetEnabled` and
`isServerFilterEnabled`. Both flags now live on `TableMetaState`, the channel
`crud` and `deleteActionPath` already use, and the load-more query reads them
from the loader data.

**Why.** A capability that shapes the request is needed on both sides of the
loader boundary: the loader builds the first page, the view builds every page
after it. A view prop is invisible to the loader by construction —
`createTableRouteLoader` runs before any component renders — so a capability
declared as a prop could never be read by the half that builds the first page.
Declaring it on `meta` puts it where both halves can reach it.

**What this does not do.** It relocates the declaration; it does not wire the
loader to consume it. A route's `fetchPage` still decides for itself what the
first page sends, so a loader that forwards `filters` unconditionally keeps
doing so whatever the flag says. Making the loader read its own capability is
follow-up work, and until it lands the two halves of a route must still be kept
consistent by hand.

**Migration.** A consumer that passed neither prop does nothing: absent meta
reproduces the previous `false` default exactly, so the request shape is
unchanged. A consumer that passed either prop moves it to the loader for the same
route and deletes it from the component:

```ts
// before — the loader
export const loader = createTableRouteLoader<Row, RowResponse>({
  /* … */
  meta: { crud: CRUD },
});
```

```tsx
// before — the component
<TableRouteView<Row, RowResponse>
  fetchPage={fetchRowsPage}
  isKeysetEnabled
  isServerFilterEnabled
/>
```

```ts
// after — the loader carries the capability
export const loader = createTableRouteLoader<Row, RowResponse>({
  /* … */
  meta: { crud: CRUD, isKeysetEnabled: true, isServerFilterEnabled: true },
});
```

```tsx
// after — the component declares only what it alone can supply
<TableRouteView<Row, RowResponse> fetchPage={fetchRowsPage} />
```

A hand-written loader puts the same two keys on the `metaState` it returns.
Nothing else moves — both `TableRouteView` and `useTableRoutePage` already
require loader data of this shape, so every affected consumer has a loader to
move the flag to. The removed props are a compile error naming the prop, so the
failure mode at upgrade is a build break, not a silent change of behaviour.

**One type narrowing comes with that.** `createTableRouteLoader` now resolves
both capabilities itself, so `metaState.isKeysetEnabled` and
`metaState.isServerFilterEnabled` are always present and typed `boolean` rather
than `boolean | undefined`. A consumer only reading `metaState` gains a
non-optional field and needs no change. A consumer annotating a hand-written
loader as `TableRouteLoaderData<…>` must declare both keys — which is exactly
what the migration above already asks that consumer to do.

**Absent still means off.** A route that declares no capability meta sends
exactly what one declaring both `false` sends. That was ADR-056's safety
property — the flags default off so that adopting the generic view cannot change
a route's request shape by accident — and it is carried over unchanged, because
sending a `filter` to an endpoint that ignores it appends unfiltered rows to a
filtered table.
