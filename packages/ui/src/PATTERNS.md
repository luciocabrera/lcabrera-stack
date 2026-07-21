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
} from '@/design-system/tokens/commons.stylex';

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
import { drawerSectionStyles } from '@/design-system/tokens/drawerSection.stylex';

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
import { filterBaseStyles } from '@/design-system/tokens/filters.stylex';

export const styles = {
  container: filterBaseStyles.container,
  input: filterBaseStyles.input,
  select: filterBaseStyles.select,
};
```

---

## Serializable Fetch Descriptors (Tool-Call Pattern)

Column filter-option fetching is described by **data, never functions** (ADR-009): functions silently die at the React Router loader boundary, and future pgAdmin-style columns are built at runtime from the DB. A `TableColumn` carries an optional `filterOptionsDescriptor`:

```ts
| { kind: 'static'; values: readonly string[] }                       // client-side slicing, no network
| { kind: 'distinct'; transport: 'bff' | 'loader';                    // generic distinct endpoints
    params: { schemaName?: string; tableName: string; columnName: string } }
```

- **Server bakes the args** — loaders call `appendDistinctFilterDescriptors` (`src/routing/`) over the columns they have (constants today, introspection rows tomorrow); `createStaticFilterOptions` (`src/utils/filters/`) emits static descriptors inline.
- **Client owns the tools** — `resolveFilterOptionsDescriptor` (`src/utils/filters/`) dispatches on `kind` and returns the `{ onLoadMore, dataSelector, dataTotalSelector }` contract consumed by `useFetchFilterData`; HTTP + validation delegate to `@repo/api` (`fetchDistinctValues`). Nothing below `SelectFilterInput` knows descriptors exist.
- Adding a descriptor kind = a new serializable variant + a new executor util + a dispatcher case — never a new function member on `TableColumn`.

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
7. **One context per domain, one provider per mount site; stores per concern.** A context split only pays off when the halves have different lifecycles/mount points (Table: config in `TableLayout`, data after Suspense in `Table`). When providers share a single mount point, do NOT stack them — use one context carrying multiple stores (`TableConfig`'s `columnsStore`/`metaStore`; `VirtualListContext`'s `listStore`/`dataStore`). Re-render isolation comes from the stores' `useSyncExternalStore` subscriptions, not from context boundaries. When a composite wraps a store-backed component, the composite's provider **composes** the inner-domain provider (`VirtualSelectProvider` renders `VirtualListProvider` around its children; the inner component exports a provider-less `<X>Content` composition) — the composite keeps its own context/meta store for its presentation metadata, mirrored from a grouped `metaState` prop via a sync effect (`TableDataProvider` precedent); shell-owned callbacks (e.g. dropdown toggle) go on the context value, dispatched through action hooks. Delegates read everything via selectors — zero props. Provider props are grouped as `<slice>State` objects (`columnsState`/`metaState`, `listState`/`metaState`), not loose keys. Canonical run: `VirtualSelect/contexts` composing `VirtualList/contexts`.
8. **Single-owner state.** Never pass the same value to two providers or mirror it into two stores — each piece of state has exactly one owning store. When one store carries fields written by different owners (`VirtualListState` = config mirror + list-owned UI state), enforce a **writer boundary**: the provider sync effect writes only the config subset and re-passes the current UI fields it read from the store, so a config re-sync never clobbers in-flight UI state (guard it with a regression test).

**Why:** beyond removing prop drilling, this is what makes the store-pattern's granular subscriptions pay off — a modal-state change re-renders only that modal, not the whole section.

Canonical examples: `Table/TableSettingsDrawer/` (shell), `Table/TableSettingsDrawer/ColumnOrderSection/` (full ownership table in its `ARCHITECTURE.md`), and `VirtualSelect/` (composed provider + meta context, zero-prop delegates).

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

---

## Architecture Documentation Rule

Every component directory must have an `ARCHITECTURE.md`. Before writing any code, read the relevant `ARCHITECTURE.md` files. After any change, update them.

See `.github/copilot-instructions.md` → Section 16 for the full workflow.
