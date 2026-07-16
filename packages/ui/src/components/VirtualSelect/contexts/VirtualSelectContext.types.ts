import type { VirtualListProviderProps } from '@repo/ui/components/VirtualList/contexts/VirtualListContext.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

import type { VirtualSelectMetaState } from '../VirtualSelect.types';

export type VirtualSelectContextValue = {
  /** Store managing the select-level presentation metadata */
  readonly metaStore: TStore<VirtualSelectMetaState>;
  /** Toggles the dropdown open state — owned by the shell (actions only) */
  readonly onToggleDropdown: () => void;
};

/**
 * The select metadata (minus the pre-computed `isListVisible`) plus the
 * shell-owned toggle callback, grouped as the provider's `metaState` prop.
 */
export type VirtualSelectMetaStateProps = Omit<
  VirtualSelectMetaState,
  'isListVisible'
> & {
  readonly onToggleDropdown: () => void;
};

/**
 * Grouped provider props: the list provider props (the `listState` group is
 * forwarded verbatim to VirtualListProvider) plus the `metaState` group
 * mirrored into the meta store.
 */
export type VirtualSelectProviderProps = VirtualListProviderProps & {
  readonly metaState: VirtualSelectMetaStateProps;
};
