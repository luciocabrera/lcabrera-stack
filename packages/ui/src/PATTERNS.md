# Component Patterns & Conventions

Established patterns used across this codebase. Follow these when creating or modifying components to ensure consistency.

---

## File & Folder Naming

Every component lives in its own folder named after the component (PascalCase):

```
ComponentName/
├── index.ts                          → barrel export only
├── ComponentName.component.tsx       → React component
├── ComponentName.types.ts            → Props and local types
├── ComponentName.stylex.ts           → StyleX styles (if needed)
└── ARCHITECTURE.md                   → Architecture documentation
```

Subcomponents follow the same pattern nested inside the parent folder:

```
ParentComponent/
├── SubComponent/
│   ├── index.ts
│   ├── SubComponent.component.tsx
│   ├── SubComponent.types.ts
│   └── SubComponent.stylex.ts
```

**Rules:**

- `index.ts` only re-exports — never contains logic
- Types live in `.types.ts`, never inline in the component file
- Stylex styles live in `.stylex.ts`, never inline in the component file
- Utilities live in `utils/` subdirectory with `.util.ts` suffix
- Barrels export what is **actually consumed externally** — the component always, its Props type only when an external consumer imports it (ADR-007: remove unused re-exports; fallow flags them). Internal consumers of a Props type import it directly from the `.types.ts` file.
- Private delegates (subcomponents/utils only consumed inside their parent module) are imported via direct file paths and need no `index.ts` at all — do not add barrels nobody imports through (ADR-007 rule 3 bans deep `utils/` implementation barrels).

---

## StyleX Composition Pattern

Styles are always applied with `stylex.props()` and composed left-to-right (later wins):

```tsx
// ✅ Correct — base → variant → conditional
{...stylex.props(
  styles.base,
  styles.size[size],
  styles.color[color],
  isActive && styles.active,
  customStylex,           // consumer override always last
)}
```

```tsx
// ❌ Wrong — inline styles, className string building
style={{ padding: '8px' }}
className={`button ${isActive ? 'active' : ''}`}
```

**Consumer overrides:** When a component accepts a `customStylex?: StyleXStyles` prop, it must always be the **last** argument to `stylex.props()` so it wins over all defaults.

**Overriding a property that already has pseudo-states — the trap.** StyleX merges
by **property key**, and a value-level conditional compiles to a _single_ key
holding every one of its class names. So a later flat value replaces the whole
thing, pseudo-states included:

```ts
// recipe
backgroundColor: { default: fill, ':hover': lift }

// consumer, applied after — this removes the hover too, not just the resting fill
backgroundColor: accent
```

That is often exactly what you want (a selected card should stop reacting to
hover). When it is not, restate the base value alongside the new state — there is
no way to add one state in isolation, because StyleX 0.19 removed selector
nesting:

```ts
// ✅ keeps the resting border AND adds the focus accent
borderColor: { default: colors.borderPrimary, ':focus-visible': colors.brandPrimary }

// ❌ silently drops the resting border
borderColor: { ':focus-visible': colors.brandPrimary }
```

**Composing a shared surface recipe:** merge it inside the `*.stylex.ts`, not at
the call site, so component files stay free of design-system imports:

```ts
export const styles = {
  ...localStyles,
  item: { ...surfaceStyles.interactiveCard, ...localStyles.item },
};
```

**Known exception — React Router `NavLink`:** React Router's `NavLink` requires a `className` render-function to expose `isActive`. Use `stylex.props(...).className` inside it — never pass raw class strings:

```tsx
// ✅ Correct — stylex.props() is still the source of truth
<RouterNavLink
  className={({ isActive }) =>
    stylex.props(styles.link, isActive && styles.linkActive).className ?? ''
  }
/>

// ❌ Wrong — raw string bypasses StyleX entirely
className={({ isActive }) => isActive ? 'active' : 'inactive'}
```

**Shared tokens over local values:** Always reach for a design token before writing a raw value:

```tsx
// ✅
padding: spacing.md;

// ❌
padding: '16px';
```

---

## Interactive Component Pattern (Button / NavLink)

All interactive elements (buttons, links, toolbar items) use the shared recipes from `commons.stylex.ts`:

```ts
// In ComponentName.stylex.ts
import {
  baseInteractiveStyles,
  colorVariants,
  rippleBase,
  sizeVariants,
} from '#ui/design-system/tokens/commons.stylex';

export const componentStyles = {
  base: {
    ...baseInteractiveStyles.element,
    ...rippleBase.ripple,
    // local overrides only (e.g. `width: '100%'` lives here, not in a shared recipe)
  },
  color: colorVariants,
  size: sizeVariants,
};
```

Then in the component, apply in order:

```tsx
{...stylex.props(
  componentStyles.base,
  componentStyles.size[size],
  componentStyles.color[color],
  isActive && componentStyles.active,
)}
```

---

## Drawer Section Pattern

All Table settings drawer sections follow the same structural hierarchy using `SidePanel` sub-components and `drawerSectionStyles` tokens:

```tsx
// Every drawer section looks like this
<SidePanelSection>
  <SidePanelSectionHeader
    title='Section Title'
    toolbar={<ActionButtons />} // mini ghost buttons
  />
  <SidePanelSectionMain>{/* section content */}</SidePanelSectionMain>
</SidePanelSection>
```

And the section's own stylex file delegates to `drawerSectionStyles`:

```ts
// SomeSection.stylex.ts
import { drawerSectionStyles } from '#ui/design-system/tokens/drawerSection.stylex';

export const styles = {
  container: drawerSectionStyles.container,
  list: drawerSectionStyles.list,
  // ...only override what differs locally
};
```

**Toolbar vs footer dual-variant pattern:** Action buttons that appear in both the section header (compact) and below content (full-width) use a `variant` prop:

```tsx
type SomeSectionToolbarProps = {
  variant?: 'toolbar' | 'footer';
};
```

| Variant     | Placement                        | Button props                    | Labels?        |
| ----------- | -------------------------------- | ------------------------------- | -------------- |
| `'toolbar'` | `SidePanelSectionHeader toolbar` | `ghost`, `mini`, `width='auto'` | No (icon only) |
| `'footer'`  | Below section content            | `outline`, `sm`, `width='full'` | Yes            |

---

## Filter Component Pattern

All column filter components are **fully controlled** and return a `ColumnFilter` discriminated union:

```tsx
// Every filter component follows this contract
type FilterProps = {
  filter?: SpecificFilter; // current value (undefined = no filter)
  onChange: (filter?: SpecificFilter) => void; // undefined = clear filter
};
```

Filter UI inputs use `filterBaseStyles` from `filters.stylex.ts`:

```ts
import { filterBaseStyles } from '#ui/design-system/tokens/filters.stylex';

export const styles = {
  container: filterBaseStyles.container,
  input: filterBaseStyles.input,
  select: filterBaseStyles.select,
};
```

---

## A Grouped Layout Is Derived, Never Stored

The layout a **grid** imposes rather than the consumer — today the group-key
hoist
([ADR-080](../../../docs/decisions/ADR-080-a-group-key-renders-in-its-own-column.md))
— is computed in the _derived_ view state and never written to the columns
store:

```ts
// ✅ one derivation point, inside the pass every re-render funnels through
getPinnedDerivedColumnsState({ …, groupingKeys });

// ❌ writing the hoist into the store's own order / pinning / visibility
columnsStore.set({ columnOrder: [...groupingKeys, ...columnOrder] });
```

**Why the store is the wrong home.** `columns`, `columnOrder`, `columnPinning`
and `columnVisibility` are what the user's layout is persisted from and what the
settings drawer offers. A hoist written there is a hoist that reaches the cookie
and comes back on the next load as an order the user never chose — and
ungrouping then has to _undo_ it, which means keeping a snapshot of the previous
layout, invalidating it on every edit made while grouped, and reconciling it when
the column set changes. Deriving keeps none of that: the layout was never
modified, so ungrouping restores it for free. The actions column is the
counterexample — it _is_ in the store, and pays exactly that cost by having to be
filtered back out of persisted pinning at every seam.

**Three rules follow, and each has a failure it prevents:**

1. **Rewrite `columnOrder`, `columnPinning.left` and `columnVisibility`
   together** (`withGroupedColumnLayout`). `getEffectiveColumns` filters by
   visibility, orders by `columnOrder`, then partitions by pinning — so a key
   hoisted in only one of them lands wherever the others left it, and a hidden
   key erases a level rather than merely hiding a column.
2. **Make the trigger a required argument of the derivation.** `groupingKeys` is
   required on `deriveColumnViewState`/`getPinnedDerivedColumnsState`, so every
   re-derivation site is a compile error until it says what is applied — a
   caller free to omit it silently drops the hoist on the next pin or hide.
3. **Lock a key in the settings list; do not remove it from it.** A group key is
   one of the consumer's own columns, so it stays listed and
   `createDraggableItems` makes it undraggable — with a flag of its own, never by
   borrowing `isStatic`, which would also freeze its width and strip its header
   menu. Filtering it out would take the row away in the one configuration where
   a user most wants to see which columns the grouping is holding.

**A gesture the derivation would undo is refused, not accepted.** The hoist
already guarantees no column can sit between two keys, so a drag could not break
anything — it would simply be undone on the next derivation, and a gesture that
visibly does nothing is worse than one that is refused.

## Column Capability Defaults

`TableColumn`'s capability flags — `isFilterable`, `isResizable`, `isSortable`,
`isStatic` — are **optional, and an omitted one is not a missing value**. Every
surface reads them through **`resolveColumnCapabilities`**
(`components/Table/utils/`), which materializes the defaults, and never tests the
flag directly:

```ts
// ✅ one resolver, defaults in one place
const { isResizable, isSortable, isStatic } = resolveColumnCapabilities(column);

// ❌ each of these re-derives a default at the point of use
column.isSortable !== false;
column.isStatic === true;
column.isStatic ?? false;
column.isFilterable && hasSomethingElse;
```

Reading the flag directly is how the same question ended up asked in several
spellings that did not agree with one another, with the defaults recorded only
in JSDoc — `git log` on `resolveColumnCapabilities.util.ts` reaches the PR that
retired them. Two consequences worth knowing:

- The resolver returns **effective** capabilities, so `isResizable` is already
  false for a static column — `isStatic` locks a column against every user
  modification, resizing included.
- A capability that is genuinely compounded with something that is _not_ a
  capability keeps its compound (`filterSettingsColumns` pairs `isStatic` with
  "has a custom `render`"); only the capability half goes through the resolver.

The resolver is also what feeds `deriveToggleCommandState`'s `isDisabled`, so a
command's availability and the gate that decides whether to render it come from
one derivation (`components/Table/commands/ARCHITECTURE.md`).

**One capability has a second gate, and it composes rather than replaces.**
Whether a column may be a **group key** is answered twice: `isGroupable` is the
consumer's declaration, and the database's catalogue decides what is actually
legal from the column's real Postgres type and its distinct-value statistics
(ADR-058), an answer that reaches the client on
`TableMetaState.groupingCapabilities` (ADR-063). Every surface that offers a
group key goes through **`resolveGroupKeyAvailability`**, which calls the
resolver above and then narrows it:

```ts
// ✅ one derivation, so the header menu and the drawer cannot disagree
const { isGroupable, refusal } = resolveGroupKeyAvailability({
  capability,
  column,
});

// ❌ the declared half only — this offers every column the endpoint will refuse
resolveColumnCapabilities(column).isGroupable;
```

Two rules go with it. An **absent** capability leaves the declared answer
standing — a route may group without shipping a map at all, so absence is
"nobody asked", not "refused". (An _aggregate_ menu reads absence the opposite
way, because an aggregate is only ever legal by the catalogue's say-so.) And the
gate is never complete: the row bound depends on the whole key combination,
statistics go stale, and grouping is URL state — so a refusal must also render,
which is the next section.

---

## A Refused Read Is Data, Not an Exception

An endpoint that **declines** a query returns a successful response carrying
`error: TableResponseError` — it does not reject (ADR-068). The table reads it
through `dataErrorSelector` (defaulted on `TableRouteView` to `response.error`),
seeds it into the data store, and the empty body says which of the two reasons it
is empty: the filters matched nothing, or the database said no.

```ts
// ✅ a refusal resolves, carrying its reason
catch (error) { return { data: [], error: toSerializableDbError(error), hasMore: false, total: 0 }; }

// ❌ rethrowing puts an expected outcome through the route error boundary,
//    which discards the page, the table state and the URL context
```

- **`fetchPage` must not reject on a refusal.** The boundary shows a sanitized
  sentence naming neither the column nor the reason, and takes the whole view
  down to say it.
- **A route with a custom `dataSelector` needs a custom `dataErrorSelector`
  too**, or its refusals are invisible again.
- **The message is the endpoint's, the heading is the table's.** Only the
  endpoint knows why; only the table knows the column's header label. Neither
  can write the other's half — see `Table/TableEmptyState/ARCHITECTURE.md`.

---

## Serializable Fetch Descriptors (Tool-Call Pattern)

Column filter-option fetching is described by **data, never functions** (ADR-009): functions silently die at the React Router loader boundary, and future pgAdmin-style columns are built at runtime from the DB. A `TableColumn` carries an optional `filterOptionsDescriptor`:

```ts
| { kind: 'static'; values: readonly string[] }                       // client-side slicing, no network
| { kind: 'distinct'; transport: 'bff' | 'loader';                    // generic distinct endpoints
    params: { schemaName?: string; tableName: string; columnName: string } }
```

- **Server bakes the args** — loaders call `appendDistinctFilterDescriptors` (`src/routing/`) over the columns they have (constants today, introspection rows tomorrow); `createStaticFilterOptions` (`src/utils/filters/`) emits static descriptors inline.
- **Client owns the tools** — `resolveFilterOptionsDescriptor` (`src/utils/filters/`) dispatches on `kind` and returns the `{ onLoadMore, dataSelector, dataTotalSelector }` contract consumed by `useFetchFilterData`; HTTP + validation delegate to `@lcabrera/api` (`fetchDistinctValues`). Nothing below `SelectFilterInput` knows descriptors exist.
- Adding a descriptor kind = a new serializable variant + a new executor util + a dispatcher case — never a new function member on `TableColumn`.

---

## Table Route Loader Pattern

A table-backed route defines its `loader` by calling **`createTableRouteLoader`** (`src/routing/loaders/`) with config plus a `fetchPage` callback — it is the loader-side counterpart to the generic `persist-cookie.action`. The factory owns the boilerplate every such route repeated: read persisted state from URL + cookies, sanitize sorting, append the primary-key tiebreaker (ADR-008), optionally bake distinct filter descriptors onto the columns (`filterOptions`, ADR-009), and assemble the serializable `columnsState` / `metaState`.

```ts
export const loader = createTableRouteLoader<Row, RowResponse>({
  appId: APP_ID, columns: COLUMNS, persistenceKey: PERSISTENCE_KEY,
  schemaName: SCHEMA_NAME, tableName: TABLE_NAME, title: TITLE,
  filterOptions: { transport: 'loader' },       // omit to leave columns undecorated
  meta: {                                       // metaState extras + capabilities
    crud: CRUD, deleteActionPath: PATH,
    isKeysetEnabled: true, isServerFilterEnabled: true,  // ADR-063; absent = off
  },
  fetchPage: ({ effectiveSorting, filters, request }) => api.fetchPage({ ... }),
});
```

- **The route owns only the fetch.** `fetchPage` receives the sanitized `filters` and the `effectiveSorting` (tiebreaker appended) and returns its promise **unawaited** — the factory hands it back as `dataPromise` for Suspense streaming.
- **The returned data-promise key is always `dataPromise`** — `TableRouteLoaderData<TData, TResponse>` (exported from the same file, derived from the factory) is the shape the view side reads. Do not rename it per route.

### The view side

The route component is **`TableRouteView`** (`src/components/TableRouteView/`) — the counterpart to the loader factory. It reads the loader data, wires load-more, defaults both selectors, and renders `TableLayout`:

```tsx
export const Orders = () => (
  <TableRouteView<Row, RowResponse>
    fetchPage={fetchOrdersPage} // a createPaginatedFetcher result
  />
);
```

- **Never re-derive the sort composition by hand.** The loader deliberately stores only the _user's_ sorting and appends the primary-key tiebreaker for the server query alone, so every load-more must reproduce it. `buildTablePageQuery` (`src/routing/shared/`) is that composition; `TableRouteView` calls it for you. A route that hand-rolls `sanitizeSorting` + `appendPrimaryKeySorting` in `onLoadMore` is one edit away from paginating incoherently.
- **A request-shaping capability is declared once, on the loader `meta` — never as a prop (ADR-063).** `isKeysetEnabled` / `isServerFilterEnabled` describe the endpoint, and **absent means off**: sending a `cursor` an endpoint ignores is noise; sending a `filter` it ignores appends unfiltered rows to a filtered table. The loader builds the first page and the view builds every page after it, so a flag either half must act on has to be somewhere both can read — a prop is invisible to the loader by construction. The test is mechanical: **if the loader or the load-more query would have to read it, it goes on `meta`.** A prop carries only what the component alone can supply (`fetchPage`, `actions`, the two selectors).
- **Escape hatch:** a route whose response is not `{ data, hasMore?, total? }`, or that needs its own JSX around the table, calls **`useTableRoutePage`** and renders `TableLayout` itself. The hook returns exactly the four props `TableLayout` needs.
- **The fetcher is a declaration, not a function you write.** `createPaginatedFetcher` (`@lcabrera/api/http`) takes the path, a response type guard and an optional base-URL strategy; the guard is required, because an unvalidated page is a cast that fails three layers away.

---

## Context + Store Pattern

State shared across a component tree is provided via React context backed by `useStore`:

```tsx
// 1. Create the store hook
const useMyStore = () => useStore<MyState>({/* initial state */});

// 2. Create the context
const MyContext = createContext<ReturnType<typeof useMyStore> | undefined>(
  undefined,
);

// 3. Create the provider
export const MyProvider = ({ children }: { children: ReactNode }) => {
  const store = useMyStore();
  return <MyContext value={store}>{children}</MyContext>;
};

// 4. Create typed selector hooks
export const useMyValue = () => {
  const store = use(MyContext);
  return useSyncExternalStore(store.subscribe, () => store.get()?.value);
};
```

Consumers **never** call `store.get()` directly in render — they always use selector hooks that subscribe via `useSyncExternalStore`.

---

## Thin Shell + Self-Connected Delegates (Store Wiring Ownership)

Every store slice is read — and every action dispatched — **inside the component that actually renders it**, never in a parent that only forwards the values as props.

**The smell to eliminate:**

```tsx
// ❌ Parent reads state/actions only to drill them into a child
const conflictModal = useGetConflictModal();
const acceptPinConflict = useAcceptPinConflict();
...
<PinConflictModal
  columnLabel={conflictModal.columnLabel}
  isOpen={conflictModal.isOpen}
  onAccept={acceptPinConflict}
/>
```

```tsx
// ✅ Child is self-connected (zero props); parent is pure composition
export const PinConflictModal = () => {
  const { columnLabel, isOpen, side } = useGetConflictModal();
  const acceptPinConflict = useAcceptPinConflict();
  ...
};
```

**Rules:**

1. **Composite components are thin shells.** Split into private delegates mirroring `TableSettingsDrawer`: `XHeader` (title/counts + toolbar), `XBody` (content), a footer toolbar, `XModals` (pure composition of self-connected modals). The root forwards only presentation flags (`isBusy`) and native props.
2. **Props shrink to presentation flags.** If a child needs `useGetX` + `useAcceptX`/`useCancelX`, those hooks belong in the child. Delete the `.types.ts` when a delegate ends up with zero props.
3. **Shared presentational components stay pure.** A shared/public component (e.g. `PinSideModal`) must not be coupled to a feature store — give it a small store-connected wrapper delegate named for the domain (e.g. `ColumnOrderPinSideModal`) that acts as its local owner.
4. **Render-callback row content becomes a component** that consumes its own actions (e.g. `ColumnOrderItemContent`, `SortItemContent`) — this also removes inline-arrow handlers from JSX.
5. **Derivations needed by two or more delegates** are extracted to a shared `*.util.ts` (e.g. `filterSettingsColumns`) instead of being computed in the parent and drilled.
6. **Document ownership.** The component's `ARCHITECTURE.md` gets a "State Ownership Rule" table (delegate → selectors read → actions dispatched); its `INVENTORY.md` row is worded "thin shell composing private delegates that own their store wiring".
7. **One context per domain, one provider per mount site; stores per concern.** A context split only pays off when the halves have different lifecycles/mount points (Table: config in `TableLayout`, data after Suspense in `Table`). When providers share a single mount point, do NOT stack them — use one context carrying multiple stores (`TableConfig`'s `columnsStore`/`groupingStore`/`metaStore`; `VirtualListContext`'s `listStore`/`dataStore`). Re-render isolation comes from the stores' `useSyncExternalStore` subscriptions, not from context boundaries. When a composite wraps a store-backed component, the composite's provider **composes** the inner-domain provider (`VirtualSelectProvider` renders `VirtualListProvider` around its children; the inner component exports a provider-less `<X>Content` composition) — the composite keeps its own context/meta store for its presentation metadata, mirrored from a grouped `metaState` prop via a sync effect (`TableDataProvider` precedent); shell-owned callbacks (e.g. dropdown toggle) go on the context value, dispatched through action hooks. Delegates read everything via selectors — zero props. Provider props are grouped as `<slice>State` objects (`columnsState`/`metaState`, `listState`/`metaState`), not loose keys. Canonical run: `VirtualSelect/contexts` composing `VirtualList/contexts`.
8. **Single-owner state.** Never pass the same value to two providers or mirror it into two stores — each piece of state has exactly one owning store. When one store carries fields written by different owners (`VirtualListState` = config mirror + list-owned UI state), enforce a **writer boundary**: the provider sync effect writes only the config subset and re-passes the current UI fields it read from the store, so a config re-sync never clobbers in-flight UI state (guard it with a regression test).
9. **Consumer-supplied configuration is a context, not a prop chain — and a value, not a store.** What a consuming app configures (`getNavigationItems`, `isAuthEnabled`, `logoutRoute`) reaches the delegate that renders it through `AppConfigContext`; `AppShell` and `AppNavigation` declare none of it. Rule 2 applies to app configuration exactly as it does to store state — a component that merely forwards a value should not name it. Because none of it changes after mount, the context carries a **plain value** with one-liner `use()` accessor hooks (`TableWrapperContext`'s shape), not a `useSyncExternalStore` store: there is nothing to subscribe to. The moment a field does start changing, it belongs in a store instead. Canonical run: `contexts/AppConfigContext/` + `components/RootComponent/` ([ADR-053](../../../docs/decisions/ADR-053-package-owned-app-root-and-app-config-context.md)).

**Why:** beyond removing prop drilling, this is what makes the store-pattern's granular subscriptions pay off — a modal-state change re-renders only that modal, not the whole section.

Canonical examples: `Table/TableSettingsDrawer/` (shell), `Table/TableSettingsDrawer/ColumnOrderSection/` (full ownership table in its `ARCHITECTURE.md`), `VirtualSelect/` (composed provider + meta context, zero-prop delegates), and `AppNavigation/NavigationFooter/` (thin shell over two self-connected controls, one of them gated on app configuration).

---

## ARIA Roles Are Declared, Never Inherited (the Table grid)

Inside `components/Table/`, the structural elements write their roles
explicitly — `grid`, `rowgroup`, `row`, `columnheader`, `gridcell` — and none of
those attributes is redundant.

```tsx
const GridRowExample = () => (
  <tr aria-rowindex={2} role='row'>
    <td role='gridcell' tabIndex={-1}>
      value
    </td>
  </tr>
);
```

**Why, and why it looks wrong:** the Table's styling takes every structural
element out of the table formatting context — the populated `<tbody>` is
`display: grid`, rows and cells are `display: flex` — because the virtualization
arithmetic depends on it. A browser drops an element's implicit table role along
with its table `display`, so for those elements the attribute is the _only_
source of the semantics, not a duplicate of a native one
([ADR-062](../../../docs/decisions/ADR-062-grid-semantics-roving-focus-and-row-identity.md)).

**Add a role only where the implicit one is actually gone.** `<table>` keeps
`display: table`, and `<thead>` and the empty-state `<tbody>` set no `display` of
their own, so none of them needs one — the single exception is `role='grid'` on
the `<table>`, which is a deliberate _upgrade_ of `table` to its interactive
subclass. Declaring a role an element still has is the redundancy this pattern
is otherwise wrongly accused of.

The fact that makes the rest load-bearing lives in a `.stylex.ts` file, which no
static analyser reads — so Biome reports several of them as redundant or
misapplied, and its suggested fix (delete the role) silently returns the grid to
being a pile of generic containers. Those findings are argued and registered in
`docs/agents/public-package-suppressions.json`; do not "tidy" the roles away,
and if you ever restore native `display` values, remove the roles in the same
change.

### Test the role attribute, not the role query

```tsx
// ✅ fails when the attribute is deleted
expect(row.getAttribute('role')).toBe('row');

// ❌ passes with or without it — jsdom resolves <tr>'s IMPLICIT role
expect(screen.getAllByRole('row')[0]?.tagName).toBe('TR');
```

Testing Library resolves implicit roles, and the implicit roles it resolves are
exactly the ones the `display` overrides destroy in a real browser. A `getByRole`
query therefore returns the same element whether or not the attribute is there,
so a test written that way cannot fail for the reason it reports: the attribute
could be deleted and the whole suite would stay green.

The trap is per-element, which is what makes it easy to miss. `role='grid'` on
`<table>` and `role='gridcell'` on `<td>` **are** caught by a role query, because
neither is that element's implicit role; `role='rowgroup'`, `role='row'` and
`role='columnheader'` are not. Whenever you add a role, delete it again and
confirm a test fails before believing the test.

---

## Controlled Component Contract

All form-like components are **fully controlled** — no internal state for the value:

```tsx
// ✅ Controlled — parent owns value
<RadioOptionGroup
  value={selectedValue}
  onChange={(v) => setSelectedValue(v)}
  options={options}
/>

// ❌ Uncontrolled — component owns hidden state
<RadioOptionGroup defaultValue="left" />
```

**Exception:** UI-only state (open/closed, hover, focus) is always local.

---

## Conditional Rendering (`noLeakedRender`)

Never render with a bare `{cond && <JSX/>}`. Biome's `noLeakedRender` is
**syntactic** — it flags _every_ `identifier && <JSX/>` (even a real `boolean`),
because a falsy non-boolean (`0`, `''`, `NaN`) renders literally (`{count && …}`
prints a stray `0`). Wrap non-boolean conditions in `Boolean(...)`:

```tsx
const Example = ({ errorMessage, icon, isOpen, isHidden }: ExampleProps) => (
  <div>
    {/* ✅ non-boolean (string | undefined, ReactNode, number) → Boolean() */}
    {Boolean(errorMessage) && <p role='alert'>{errorMessage}</p>}
    {Boolean(icon) && <span>{icon}</span>}

    {/* ✅ already boolean (comparison / negation) → leave BARE;
        Boolean() here would trip unicorn/no-useless-coercion */}
    {isOpen !== false && <Panel />}
    {!isHidden && <Toolbar />}

    {/* ❌ {errorMessage && <p/>}  — bare non-boolean, noLeakedRender */}
    {/* ❌ {!!errorMessage && <p/>} — banned by noImplicitCoercions */}
  </div>
);
```

Do **not** reach for a ternary to dodge it: `{cond ? <X/> : null}` is banned by
`unicorn/no-null` and `{cond ? <X/> : undefined}` is itself a `noLeakedRender`
leak. And do **not** add a `getIsTruthy`-style helper — a `(v) => Boolean(v)`
wrapper is banned by `unicorn/prefer-native-coercion-functions` (it _is_
`Boolean`). `Boolean(cond) &&` is the one idiom that satisfies every linter.
(Wrapping in `Boolean()` opaques TS `&&`-narrowing, so make the rendered body
null-safe — `{Boolean(data?.err) && <p>{data?.err}</p>}`.) See ADR-035 §7.

---

## Naming Conventions

| Thing                  | Convention                                     | Example                      |
| ---------------------- | ---------------------------------------------- | ---------------------------- |
| Component              | PascalCase                                     | `VirtualSelectTrigger`       |
| Hook                   | camelCase `use` prefix                         | `useVirtualization`          |
| Utility function       | camelCase                                      | `getFilteredOptions`         |
| Utility file           | `.util.ts` suffix                              | `getFilteredOptions.util.ts` |
| StyleX file            | `.stylex.ts` suffix                            | `Button.stylex.ts`           |
| Type file              | `.types.ts` suffix                             | `Button.types.ts`            |
| Context file           | `.context.ts` suffix                           | `TableData.context.ts`       |
| Constants file         | `.constants.ts` suffix                         | `VirtualList.constants.ts`   |
| Test file              | `.test.tsx` suffix, co-located                 | `Button.test.tsx`            |
| Exported styles object | `styles` (local) or `componentStyles` (shared) | `buttonStyles`               |
| Props type             | `ComponentNameProps`                           | `ButtonProps`                |

---

## Props Forwarding

Components that wrap a native HTML element extend `ComponentPropsWithoutRef<'element'>` and spread `...rest` after their own props, so consumers can pass any native attribute:

```tsx
// Types
type MyProps = ComponentPropsWithoutRef<'div'> & {
  myProp: string;
};

// Component
export const MyComponent = ({ myProp, ...rest }: MyProps) => (
  <div {...rest} {...stylex.props(styles.container)}>
    {/* StyleX props come AFTER ...rest to ensure styles win */}
  </div>
);
```

> Note: `stylex.props()` spread must always come **after** `{...rest}` to prevent consumers from overriding StyleX-managed styles with a raw `style` or `className`.

**An attribute a component's correctness depends on goes after `{...rest}` too.**
The default is to spread `...rest` first so consumers can override anything —
that is the point of forwarding. But the Table grid's `role`, `scope`,
`aria-sort` and `aria-rowcount` are the _only_ source of semantics the CSS has
stripped (see "ARIA Roles Are Declared, Never Inherited"), and an attribute any
caller can replace by accident is a default, not a contract. Those are written
after the spread, and each has a test asserting a conflicting prop does not win —
without one, the spread order is a convention that nothing enforces.

---

## Architecture Documentation Rule

Every component directory must have an `ARCHITECTURE.md`. Before writing any code, read the relevant `ARCHITECTURE.md` files. After any change, update them.

See `.github/copilot-instructions.md` → Section 16 for the full workflow.
