import type { VirtualListDataState } from '@repo/ui/components/VirtualList';
import type { StyleXStyles } from '@stylexjs/stylex';

/**
 * Select-level presentation metadata mirrored into the meta store by
 * `VirtualSelectConfigProvider` (isListVisible is pre-computed from
 * `isAlwaysOpen || isOpen`). Delegates read it through one-liner selectors.
 */
export type VirtualSelectMetaState = {
  readonly customStylex?: StyleXStyles;
  readonly isAlwaysOpen: boolean;
  readonly isBusy: boolean;
  readonly isListVisible: boolean;
  readonly isOpen: boolean;
  readonly listboxId: string;
  readonly mode: VirtualSelectMode;
  readonly placeholder: string;
};

export type VirtualSelectMode = 'multi' | 'single';

export type VirtualSelectOption = {
  readonly label: string;
  readonly value: string;
};

export type VirtualSelectProps = {
  /** Optional StyleX overrides for the list container (background, border, etc.) */
  readonly customStylex?: StyleXStyles;
  /** Current state of async-loaded data (for fetch mode). Mutually exclusive with `options`. */
  readonly dataState?: VirtualListDataState;
  /** When true, the list is always visible without a trigger button */
  readonly isAlwaysOpen?: boolean;
  /** Shows a shimmer overlay and disables trigger interaction while the parent is busy */
  readonly isBusy?: boolean;
  /** Optional id used to wire trigger/listbox ARIA relationships */
  readonly listboxId?: string;
  /** Height for the virtual dropdown list (CSS value, e.g. '18.75rem') */
  readonly listMaxHeight?: string;
  /** Selection mode: 'single' closes on select, 'multi' shows checkboxes + select all */
  readonly mode: VirtualSelectMode;
  /** Called when the selection changes */
  readonly onChange: (selected: string[]) => void;
  /** Callback to fetch initial data on mount */
  readonly onFetchInitial?: () => Promise<void> | void;
  /** Callback to fetch more data on scroll */
  readonly onFetchMore?: () => Promise<void> | void;
  /** Called when the dropdown opens or closes */
  readonly onOpenChange?: (isOpen: boolean) => void;
  /** Static options — plain strings (value = label) or { label, value } pairs for key/display separation */
  readonly options?: readonly string[] | readonly VirtualSelectOption[];
  /** Placeholder text when nothing is selected */
  readonly placeholder?: string;
  /** Currently selected value(s) */
  readonly selected: readonly string[];
  /** When true, the component expands to fill all available vertical space */
  readonly shouldFillHeight?: boolean;
  /** Show a "Loaded: x / total" legend below the trigger */
  readonly shouldShowLoadedCount?: boolean;
};
