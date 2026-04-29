# VirtualSelect Architecture

Dropdown select component (single or multi) backed by a virtualized list, with tag-chip display, overflow counting, and optional async infinite-scroll data loading.

## File Structure

```
VirtualSelect/
├── index.ts                          → Barrel export
├── VirtualSelect.component.tsx       → Orchestrator: open state, tag layout, data bridge
├── VirtualSelect.types.ts            → VirtualSelectProps, VirtualSelectMode
├── VirtualSelect.stylex.ts           → Container + dropdown position styles
│
├── VirtualSelectTrigger/             → Combobox trigger (placeholder / label / tag chips)
│   ├── ARCHITECTURE.md
│   ├── index.ts
│   ├── VirtualSelectTrigger.component.tsx
│   ├── VirtualSelectTrigger.stylex.ts   (exports TRIGGER_MAX_HEIGHT)
│   └── VirtualSelectTrigger.types.ts
│
└── utils/
    ├── ARCHITECTURE.md
    ├── index.ts
    ├── countVisibleTags.util.ts      → DOM-measure visible tag count
    └── getDropdownStyle.util.ts      → Pick dropdown position style
```

## Component Hierarchy

```mermaid
graph TD
  VS["VirtualSelect"] --> VST["VirtualSelectTrigger"]
  VS --> VL["VirtualList (dropdown)"]
```

## Dependencies

```mermaid
graph LR
  VS["VirtualSelect"] --> VST["VirtualSelectTrigger"]
  VS --> VL["VirtualList"]
  VS --> useClickOutside["useClickOutside (hook)"]
  VS --> countVisibleTags["utils/countVisibleTags"]
  VS --> getDropdownStyle["utils/getDropdownStyle"]
  VS --> VS_stylex["VirtualSelect.stylex"]

  VST --> Tag["Tag component"]
  VST --> VST_stylex["VirtualSelectTrigger.stylex"]

  VL --> VirtualList_arch["(see VirtualList ARCHITECTURE.md)"]
```

## Data Flow

```mermaid
graph TD
  Parent -->|"selected[], onChange, options/dataState"| VS["VirtualSelect"]

  VS -->|"visibleTags, overflowCount"| VST["VirtualSelectTrigger"]
  VST -->|"onRemoveTag → filters selected"| VS
  VST -->|"onToggle → setIsOpen"| VS

  VS -->|"filter={type:'select', values:selected}"| VL["VirtualList"]
  VL -->|"onChange(SelectFilter)"| VS

  VS -->|"mode=single: pick new value, close"| Parent
  VS -->|"mode=multi: forward all values"| Parent
```

## Selection Modes

| Mode     | Trigger display      | VirtualList props                           | On change                              |
| -------- | -------------------- | ------------------------------------------- | -------------------------------------- |
| `single` | Single text label    | `hasCheckboxes=false`, `hasSelectAll=false` | Pick newly added value, close dropdown |
| `multi`  | Tag chips + overflow | `hasCheckboxes=true`, `hasSelectAll=true`   | Forward full values array, stay open   |

## Dropdown Positioning

Controlled by `getDropdownStyle(isAlwaysOpen, shouldFillHeight)`:

| `isAlwaysOpen` | `shouldFillHeight` | Style applied        | Behaviour                           |
| -------------- | ------------------ | -------------------- | ----------------------------------- |
| `false`        | any                | `dropdownAbsolute`   | Floats below trigger, z-elevated    |
| `true`         | `false`            | `dropdownStatic`     | Inline block (e.g. filter panel)    |
| `true`         | `true`             | `dropdownStaticFill` | Flex-fill (e.g. full-height drawer) |

The container and dropdown use explicit `border-box`, `min-width: 0`, and
`max-width: 100%` sizing so both floating and always-open variants remain
contained by drawer/card parents.

## Static vs. Async Data

```mermaid
graph TD
  A["VirtualSelect mounts"] --> B{"dataState prop provided?"}
  B -->|yes| C["use dataState directly (async/paginated)"]
  B -->|no| D["wrap options[] in synthetic VirtualListDataState (hasMore=false, isLoading=false)"]
  C & D --> VL["pass effectiveDataState to VirtualList"]
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

`useClickOutside` listens on `containerRef` (wraps both trigger and dropdown). When a click lands outside the container, `handleClose()` sets `isOpen = false`.

## Props

| Prop               | Type                           | Default       | Description                                        |
| ------------------ | ------------------------------ | ------------- | -------------------------------------------------- |
| `customStylex`     | `StyleXStyles`                 | —             | Style overrides for the dropdown container         |
| `dataState`        | `VirtualListDataState`         | —             | Async data (mutually exclusive with `options`)     |
| `isAlwaysOpen`     | `boolean`                      | `false`       | List is always visible; trigger is non-interactive |
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
