# VirtualSelect Architecture

Dropdown select component (single or multi) backed by a virtualized list, with tag-chip display, overflow counting, and optional async infinite-scroll data loading.

## File Structure

```
VirtualSelect/
├── index.ts                          → Barrel export
├── VirtualSelect.component.tsx       → Orchestrator: refs, open state, option/display resolution
├── VirtualSelect.types.ts            → VirtualSelectProps, VirtualSelectMode
├── VirtualSelect.stylex.ts           → Container styles
│
├── VirtualSelectHeader/              → Private delegate — busy overlay + trigger, owns tag removal
│   └── (see its ARCHITECTURE.md)
│
├── VirtualSelectDropdown/            → Private delegate — positioned listbox shell around VirtualList,
│   └── (see its ARCHITECTURE.md)       owns selection-change resolution + dropdown styles
│
├── VirtualSelectTrigger/             → Combobox trigger (placeholder / label / tag chips)
│   ├── ARCHITECTURE.md
│   ├── index.ts
│   ├── VirtualSelectTrigger.component.tsx
│   ├── VirtualSelectTrigger.stylex.ts   (exports TRIGGER_MAX_HEIGHT)
│   └── VirtualSelectTrigger.types.ts
│
├── hooks/
│   ├── useVirtualSelectDropdown.hook.ts     → Open/close state + onOpenChange notification
│   └── useVirtualSelectTagOverflow.hook.ts  → ResizeObserver-driven visible tag count
│
└── utils/
    ├── ARCHITECTURE.md
    ├── index.ts
    └── (option/selection/display resolution — see utils/ARCHITECTURE.md)
```

`VirtualSelectHeader` and `VirtualSelectDropdown` are private delegates (no `index.ts`, imported via direct file paths — ADR-007).

## Component Hierarchy

```mermaid
graph TD
  VS["VirtualSelect"] --> VSH["VirtualSelectHeader"]
  VS --> VSD["VirtualSelectDropdown"]
  VSH --> VST["VirtualSelectTrigger"]
  VSD --> VL["VirtualList"]
```

## Dependencies

```mermaid
graph LR
  VS["VirtualSelect"] --> VSH["VirtualSelectHeader"]
  VS --> VSD["VirtualSelectDropdown"]
  VS --> useClickOutside["useClickOutside (hook)"]
  VS --> hooks["hooks/useVirtualSelectDropdown + useVirtualSelectTagOverflow"]
  VS --> resolveOptions["utils/resolveVirtualSelectOptions"]
  VS --> resolveDisplay["utils/resolveVirtualSelectDisplay"]
  VS --> VS_stylex["VirtualSelect.stylex (container)"]

  VSH --> VST["VirtualSelectTrigger"]
  VSH --> VSH_stylex["VirtualSelectHeader.stylex\n<small>skeleton.loadingOverlay + shimmerWave</small>"]

  VSD --> VL["VirtualList"]
  VSD --> resolveChange["utils/resolveVirtualSelectChange"]
  VSD --> VSD_stylex["VirtualSelectDropdown.stylex + getDropdownStyle"]

  VST --> Tag["Tag component"]
  VST --> VST_stylex["VirtualSelectTrigger.stylex"]

  VL --> VirtualList_arch["(see VirtualList ARCHITECTURE.md)"]
```

## Data Flow

```mermaid
graph TD
  Parent -->|"selected[], onChange, options/dataState"| VS["VirtualSelect"]

  VS -->|"visibleTags, overflowCount, getValueFromLabel"| VSH["VirtualSelectHeader"]
  VSH -->|"handleRemoveTag → onChange(filtered selected)"| Parent
  VSH -->|"onToggle → toggleDropdown"| VS

  VS -->|"effectiveDataState, selectedLabels, getValueFromLabel"| VSD["VirtualSelectDropdown"]
  VSD -->|"filter={type:'select', values:selectedLabels}"| VL["VirtualList"]
  VL -->|"onChange(SelectFilter)"| VSD

  VSD -->|"mode=single: onChange(new value) + onClose"| Parent
  VSD -->|"mode=multi: onChange(all values), stays open"| Parent
```

The orchestrator resolves options (`resolveVirtualSelectOptions`), display state (`resolveVirtualSelectDisplay`), open state (`useVirtualSelectDropdown`), and tag overflow (`useVirtualSelectTagOverflow`), then hands the derived values to the two delegates. The delegates own their handlers: `VirtualSelectHeader` resolves tag removal, `VirtualSelectDropdown` resolves list selection changes.

## Selection Modes

| Mode     | Trigger display      | VirtualList props                           | On change                              |
| -------- | -------------------- | ------------------------------------------- | -------------------------------------- |
| `single` | Single text label    | `hasCheckboxes=false`, `hasSelectAll=false` | Pick newly added value, close dropdown |
| `multi`  | Tag chips + overflow | `hasCheckboxes=true`, `hasSelectAll=true`   | Forward full values array, stay open   |

## Dropdown Positioning

Owned by `VirtualSelectDropdown` (see its `ARCHITECTURE.md`): `getDropdownStyle({ isAlwaysOpen, shouldFillHeight })` picks between floating (`dropdownAbsolute`), inline (`dropdownStatic`), and fill-height (`dropdownStaticFill`) positioning.

The container and dropdown use explicit `border-box`, `min-width: 0`, and
`max-width: 100%` sizing so both floating and always-open variants remain
contained by drawer/card parents.

## Static vs. Async Data

```mermaid
graph TD
  A["VirtualSelect mounts"] --> B{"dataState prop provided?"}
  B -->|yes| C["use dataState directly (async/paginated)"]
  B -->|no| D["wrap options[] in synthetic VirtualListDataState (hasMore=false, isLoading=false)"]
  C & D --> VL["pass effectiveDataState to VirtualSelectDropdown → VirtualList"]
```

## Tag Overflow (multi mode)

```mermaid
graph TD
  A["ResizeObserver on triggerRef"] --> B["countVisibleTags({ totalCount, trigger })"]
  B --> C["setVisibleTagCount(n)"]
  C --> D["visibleTags = selected.slice(0, n)"]
  C --> E["overflowCount = selected.length - n"]
  E -->|"> 0"| F["VirtualSelectTrigger shows '+N more' badge"]
```

## Click-Outside Handling

`useClickOutside` listens on `containerRef` (wraps both header and dropdown). When a click lands outside the container, `closeDropdown()` sets `isOpen = false`.

## Busy State

Owned by `VirtualSelectHeader` (see its `ARCHITECTURE.md`): when `isBusy` is true, a shimmer overlay renders over the container and the trigger is disabled so the dropdown cannot be opened while the parent UI is loading. `useVirtualSelectDropdown` also suppresses `toggleDropdown` while busy.

## Props

| Prop               | Type                           | Default       | Description                                        |
| ------------------ | ------------------------------ | ------------- | -------------------------------------------------- |
| `customStylex`     | `StyleXStyles`                 | —             | Style overrides for the dropdown container         |
| `dataState`        | `VirtualListDataState`         | —             | Async data (mutually exclusive with `options`)     |
| `isBusy`           | `boolean`                      | `false`       | Shows a shimmer overlay and disables trigger input |
| `isAlwaysOpen`     | `boolean`                      | `false`       | List is always visible; trigger is non-interactive |
| `listboxId`        | `string`                       | generated     | id wiring the trigger/listbox ARIA relationship    |
| `listMaxHeight`    | `string`                       | `'18.75rem'`  | CSS max-height for the VirtualList scroll area     |
| `mode`             | `'single' \| 'multi'`          | —             | Selection behaviour (required)                     |
| `onChange`         | `(selected: string[]) => void` | —             | Called on every selection change                   |
| `onFetchInitial`   | `() => Promise<void> \| void`  | —             | Forwarded to VirtualList for initial fetch         |
| `onFetchMore`      | `() => Promise<void> \| void`  | —             | Forwarded to VirtualList for infinite scroll       |
| `onOpenChange`     | `(isOpen: boolean) => void`    | —             | Notifies parent of open/close state                |
| `options`          | `string[]`                     | `[]`          | Static options (used when no `dataState`)          |
| `placeholder`      | `string`                       | `'Select...'` | Shown when nothing is selected                     |
| `selected`         | `string[]`                     | —             | Controlled selected values (required)              |
| `shouldFillHeight` | `boolean`                      | `false`       | Expand to fill available vertical space            |
