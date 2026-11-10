import type { StyleXStyles } from '@stylexjs/stylex';

import type { VirtualListDataState } from '#ui/components/VirtualList';

export type VirtualSelectAttachedEdge = 'bottom' | 'top';

export type VirtualSelectMetaState = {
  readonly attachedEdge?: VirtualSelectAttachedEdge;
  readonly customStylex?: StyleXStyles;
  readonly isAlwaysOpen: boolean;
  readonly isBusy: boolean;
  readonly isDisabled: boolean;
  readonly isListVisible: boolean;
  readonly isOpen: boolean;
  readonly labelId?: string;
  readonly listboxId: string;
  readonly mode: VirtualSelectMode;
  readonly placeholder: string;
  readonly placement: VirtualSelectPlacement;
};

export type VirtualSelectMode = 'multi' | 'single';

export type VirtualSelectOption = {
  readonly label: string;
  readonly value: string;
};

export type VirtualSelectPlacement = 'auto' | 'bottom' | 'top';

export type VirtualSelectProps = {
  /** The trigger edge that sits flush against a neighbouring control: square corners, and no border on `bottom`. */
  readonly attachedEdge?: VirtualSelectAttachedEdge;
  readonly customStylex?: StyleXStyles;
  readonly dataState?: VirtualListDataState;
  readonly isAlwaysOpen?: boolean;
  readonly isBusy?: boolean;
  /** Inert, but not loading: no shimmer, unlike `isBusy`. */
  readonly isDisabled?: boolean;
  readonly label?: string;
  readonly listboxId?: string;
  readonly listMaxHeight?: string;
  readonly mode: VirtualSelectMode;
  readonly name?: string;
  readonly onChange: (selected: string[]) => void;
  readonly onFetchInitial?: (signal: AbortSignal) => Promise<void> | void;
  readonly onFetchMore?: () => Promise<void> | void;
  readonly onOpenChange?: (isOpen: boolean) => void;
  readonly options?: readonly string[] | readonly VirtualSelectOption[];
  readonly placeholder?: string;
  /** `auto` (the default) opens below and flips above only when below cannot fit a few rows. */
  readonly placement?: VirtualSelectPlacement;
  readonly selected: readonly string[];
  readonly shouldFillHeight?: boolean;
  readonly shouldShowLoadedCount?: boolean;
};
