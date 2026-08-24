import type { TStore } from '#ui/hooks/useStore.hook';
import type { SelectFilter } from '#ui/types/filterOperators.types';

import type {
  VirtualListDataState,
  VirtualListDataStoreState,
  VirtualListProps,
  VirtualListState,
} from '../VirtualList.types';

export type VirtualListContextValue = {
  readonly dataStore: TStore<VirtualListDataStoreState>;
  readonly listStore: TStore<VirtualListState>;
  readonly onChange: VirtualListProps['onChange'];
  readonly onFetchMore?: VirtualListProps['onFetchMore'];
};

export type VirtualListProviderProps = {
  readonly children: React.ReactNode;
  readonly dataState: VirtualListDataState;
  readonly filter?: SelectFilter;
  readonly listState: VirtualListStateProps;
};

export type VirtualListStateProps = Omit<
  VirtualListProps,
  'dataState' | 'filter'
>;
