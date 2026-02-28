import type { VirtualListDataState } from '@/components/VirtualList';

export type VirtualSelectMode = 'multi' | 'single';

export type VirtualSelectProps = {
  /** Current state of async-loaded data (for fetch mode). Mutually exclusive with `options`. */
  dataState?: VirtualListDataState;
  /** Height for the virtual dropdown list (CSS value, e.g. '18.75rem') */
  listMaxHeight?: string;
  /** Selection mode: 'single' closes on select, 'multi' shows checkboxes + select all */
  mode: VirtualSelectMode;
  /** Called when the selection changes */
  onChange: (selected: string[]) => void;
  /** Callback to fetch initial data on mount */
  onFetchInitial?: () => Promise<void> | void;
  /** Callback to fetch more data on scroll */
  onFetchMore?: () => Promise<void> | void;
  /** Called when the dropdown opens or closes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Static options (used when no dataState provided) */
  options?: string[];
  /** Placeholder text when nothing is selected */
  placeholder?: string;
  /** Currently selected value(s) */
  selected: string[];
  /** Show a "Loaded: x / total" legend below the trigger */
  showLoadedCount?: boolean;
};
