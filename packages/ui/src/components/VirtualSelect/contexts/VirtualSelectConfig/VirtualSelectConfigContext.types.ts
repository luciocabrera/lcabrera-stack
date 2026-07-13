import type { TStore } from '@repo/ui/hooks/useStore.hook';

import type { VirtualSelectMetaState } from '../../VirtualSelect.types';

export type VirtualSelectConfigContextValue = {
  /** Store managing the select-level presentation metadata */
  readonly metaStore: TStore<VirtualSelectMetaState>;
  /** Toggles the dropdown open state — owned by the shell (actions only) */
  readonly onToggleDropdown: () => void;
};

/**
 * The select metadata (minus the pre-computed `isListVisible`) plus the
 * shell-owned toggle callback exposed on the context value.
 */
export type VirtualSelectConfigProviderProps = Omit<
  VirtualSelectMetaState,
  'isListVisible'
> & {
  readonly children: React.ReactNode;
  readonly onToggleDropdown: () => void;
};
