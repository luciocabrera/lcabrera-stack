import type { TStore } from '@repo/ui/hooks/useStore.hook';
import type { SelectFilter } from '@repo/ui/types/filterOperators.types';

import type {
  VirtualListDataState,
  VirtualListDataStoreState,
} from '../../VirtualList.types';

export type VirtualListDataContextValue = {
  /** Store managing the data mirror plus the pre-computed derived list state */
  readonly dataStore: TStore<VirtualListDataStoreState>;
};

/**
 * Only the controlled data props — config flags and callbacks live solely
 * on the config context (single owner) and are read from there.
 */
export type VirtualListDataProviderProps = {
  readonly children: React.ReactNode;
  readonly dataState: VirtualListDataState;
  readonly filter?: SelectFilter;
};
