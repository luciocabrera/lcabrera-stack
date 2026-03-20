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
  widthVariants,
} from '@/design-system/tokens/commons.stylex';

export const componentStyles = {
  base: {
    ...baseInteractiveStyles.element,
    ...rippleBase.ripple,
    // local overrides only
  },
  color: colorVariants,
  size: sizeVariants,
  width: widthVariants,
};
```

Then in the component, apply in order:

```tsx
{...stylex.props(
  componentStyles.base,
  componentStyles.size[size],
  componentStyles.color[color],
  componentStyles.width[width],
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

## Context + Store Pattern

State shared across a component tree is provided via React context backed by `useStore`:

```tsx
// 1. Create the store hook
const useMyStore = () =>
  useStore<MyState>({
    /* initial state */
  });

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
