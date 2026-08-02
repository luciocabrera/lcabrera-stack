import type { VirtualListProviderProps } from '@lcabrera/ui/components/VirtualList/contexts/VirtualListContext.types';
import type { TStore } from '@lcabrera/ui/hooks/useStore.hook';
import type { RefObject } from 'react';

import type { VirtualSelectMetaState } from '../VirtualSelect.types';

export type VirtualSelectContextValue = {
  /** The shell's outer container — the rect a floating dropdown anchors to. A ref, not store state: it never triggers a render. */
  readonly anchorRef: RefObject<HTMLDivElement | null>;
  /** Store managing the select-level presentation metadata */
  readonly metaStore: TStore<VirtualSelectMetaState>;
  /** Closes the dropdown — owned by the shell (actions only). Not a toggle: a toggle is suppressed while the list is busy. */
  readonly onCloseDropdown: () => void;
  /** Toggles the dropdown open state — owned by the shell (actions only) */
  readonly onToggleDropdown: () => void;
};

/**
 * The select metadata (minus the pre-computed `isListVisible`) plus the
 * shell-owned open-state callbacks, grouped as the provider's `metaState` prop.
 */
export type VirtualSelectMetaStateProps = Omit<
  VirtualSelectMetaState,
  'isListVisible'
> & {
  readonly onCloseDropdown: () => void;
  readonly onToggleDropdown: () => void;
};

/**
 * Grouped provider props: the list provider props (the `listState` group is
 * forwarded verbatim to VirtualListProvider) plus the `metaState` group
 * mirrored into the meta store.
 */
export type VirtualSelectProviderProps = VirtualListProviderProps & {
  readonly anchorRef: VirtualSelectContextValue['anchorRef'];
  readonly metaState: VirtualSelectMetaStateProps;
};
