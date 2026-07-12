import type { SelectFilter } from '@repo/ui/types/filterOperators.types';

import type {
  ListFilterMode,
  VirtualListDataState,
  VirtualListDataStoreState,
} from '../../../VirtualList.types';

import { resolveListDerivedState } from '../../../utils';

type GetInitialListDataStateArgs = {
  readonly dataState: VirtualListDataState;
  readonly filter?: SelectFilter;
  readonly hasFetchInitial: boolean;
  readonly hasSelectAll: boolean;
  readonly listFilterMode: ListFilterMode;
  readonly searchTerm: string;
};

/**
 * Builds the data-store state from the controlled `dataState`/`filter` props:
 * the raw mirror plus the pre-computed derived list state.
 */
export const getInitialListDataState = ({
  dataState,
  filter,
  hasFetchInitial,
  hasSelectAll,
  listFilterMode,
  searchTerm,
}: GetInitialListDataStateArgs) => {
  const selectedValues = filter?.values ?? [];

  const state: VirtualListDataStoreState = {
    ...resolveListDerivedState({
      data: dataState.data,
      hasFetchInitial,
      hasSelectAll,
      isLoading: dataState.isLoading,
      isLoadingMore: dataState.isLoadingMore,
      listFilterMode,
      searchTerm,
      selectedValues,
    }),
    data: dataState.data,
    hasMore: dataState.hasMore,
    isLoading: dataState.isLoading,
    isLoadingMore: dataState.isLoadingMore,
    selectedValues,
    totalCount: dataState.totalCount,
  };

  return state;
};
