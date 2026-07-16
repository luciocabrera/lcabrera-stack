import type { ListFilterMode } from '../VirtualList.types';

import { getFilteredOptions } from './getFilteredOptions.util';
import { getIsAllSelected } from './getIsAllSelected.util';
import { resolveContentMode } from './resolveContentMode.util';
import { resolveIsInitialLoading } from './resolveIsInitialLoading.util';

type ResolveListDerivedStateArgs = {
  readonly data: readonly string[];
  readonly hasFetchInitial: boolean;
  readonly hasSelectAll: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly listFilterMode: ListFilterMode;
  readonly searchTerm: string;
  readonly selectedValues: readonly string[];
};

/**
 * Computes the derived slice of the data store (filtered options, select-all
 * flags, virtualized row count, content mode). Called wherever an input
 * changes: the data provider sync effect and the UI actions.
 */
export const resolveListDerivedState = ({
  data,
  hasFetchInitial,
  hasSelectAll,
  isLoading,
  isLoadingMore,
  listFilterMode,
  searchTerm,
  selectedValues,
}: ResolveListDerivedStateArgs) => {
  const filteredOptions = getFilteredOptions({
    listFilterMode,
    options: data,
    searchTerm,
    selectedValues,
  });
  const shouldShowSelectAll = hasSelectAll && filteredOptions.length > 1;
  const totalItems = shouldShowSelectAll
    ? filteredOptions.length + 1
    : filteredOptions.length;
  const isAllSelected = getIsAllSelected({ filteredOptions, selectedValues });
  const isInitialLoading = resolveIsInitialLoading({
    hasFetchInitial,
    isLoading,
    isLoadingMore,
    optionsCount: data.length,
  });
  const contentMode = resolveContentMode({
    filteredOptionsCount: filteredOptions.length,
    isInitialLoading,
  });

  return {
    contentMode,
    filteredOptions,
    isAllSelected,
    shouldShowSelectAll,
    totalItems,
  };
};
