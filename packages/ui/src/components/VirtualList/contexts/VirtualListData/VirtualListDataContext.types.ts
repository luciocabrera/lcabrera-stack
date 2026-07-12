import type { TStore } from '@repo/ui/hooks/useStore.hook';
import type { SelectFilter } from '@repo/ui/types/filterOperators.types';

import type {
  VirtualListDataState,
  VirtualListDataStoreState,
  VirtualListProps,
} from '../../VirtualList.types';

export type VirtualListDataContextValue = {
  /** Store managing the data mirror plus the pre-computed derived list state */
  readonly dataStore: TStore<VirtualListDataStoreState>;
};

export type VirtualListDataProviderProps = {
  readonly children: React.ReactNode;
  readonly dataState: VirtualListDataState;
  readonly filter?: SelectFilter;
  readonly hasSelectAll: boolean;
  readonly onFetchInitial?: VirtualListProps['onFetchInitial'];
};
