import type { StyleXStyles } from '@stylexjs/stylex';

import type { VirtualListDataState } from '#ui/components/VirtualList';

export type VirtualSelectMetaState = {
  readonly customStylex?: StyleXStyles;
  readonly isAlwaysOpen: boolean;
  readonly isBusy: boolean;
  readonly isDisabled: boolean;
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
  readonly customStylex?: StyleXStyles;
  readonly dataState?: VirtualListDataState;
  readonly isAlwaysOpen?: boolean;
  readonly isBusy?: boolean;
  /** Inert, but not loading: no shimmer, unlike `isBusy`. */
  readonly isDisabled?: boolean;
  readonly listboxId?: string;
  readonly listMaxHeight?: string;
  readonly mode: VirtualSelectMode;
  readonly onChange: (selected: string[]) => void;
  readonly onFetchInitial?: () => Promise<void> | void;
  readonly onFetchMore?: () => Promise<void> | void;
  readonly onOpenChange?: (isOpen: boolean) => void;
  readonly options?: readonly string[] | readonly VirtualSelectOption[];
  readonly placeholder?: string;
  readonly selected: readonly string[];
  readonly shouldFillHeight?: boolean;
  readonly shouldShowLoadedCount?: boolean;
};
