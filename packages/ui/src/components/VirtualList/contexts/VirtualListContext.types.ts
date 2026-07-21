import type { TStore } from '@lcabrera/ui/hooks/useStore.hook';
import type { SelectFilter } from '@lcabrera/ui/types/filterOperators.types';

import type {
  VirtualListDataState,
  VirtualListDataStoreState,
  VirtualListProps,
  VirtualListState,
} from '../VirtualList.types';

export type VirtualListContextValue = {
  /** Store managing the data mirror plus the pre-computed derived list state */
  readonly dataStore: TStore<VirtualListDataStoreState>;
  /** Store managing the config props mirror plus the list-owned UI state */
  readonly listStore: TStore<VirtualListState>;
  /** Called on selection changes — selection is parent-owned (actions only) */
  readonly onChange: VirtualListProps['onChange'];
  /** Optional infinite-scroll fetch callback (actions only) */
  readonly onFetchMore?: VirtualListProps['onFetchMore'];
};

/**
 * Grouped provider props (TableConfigProvider-style): the controlled data
 * props plus the `listState` group mirrored into the list store.
 */
export type VirtualListProviderProps = {
  readonly children: React.ReactNode;
  readonly dataState: VirtualListDataState;
  readonly filter?: SelectFilter;
  readonly listState: VirtualListStateProps;
};

/** Config flags and parent callbacks mirrored into the list store. */
export type VirtualListStateProps = Omit<
  VirtualListProps,
  'dataState' | 'filter'
>;
