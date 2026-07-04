import type {
  ListFilterMode,
  VirtualListDataState,
} from '../../VirtualList.types';

import { getFilteredOptions } from '../../utils';
import { resolveContentMode } from './resolveContentMode.util';

export type ResolveVirtualListBodyStateArgs = {
  readonly dataState: VirtualListDataState;
  readonly hasFetchInitial: boolean;
  readonly hasSelectAll: boolean;
  readonly listFilterMode: ListFilterMode;
  readonly searchTerm: string;
  readonly selectedValues: readonly string[];
};

export const resolveVirtualListBodyState = ({
  dataState,
  hasFetchInitial,
  hasSelectAll,
  listFilterMode,
  searchTerm,
  selectedValues,
}: ResolveVirtualListBodyStateArgs) => {
  const { data, isLoading, isLoadingMore } = dataState;
  const isLoadingOptions = isLoading || isLoadingMore;
  const isBootstrappingInitialLoad =
    hasFetchInitial && data.length === 0 && !isLoadingOptions;
  const isInitialLoading =
    data.length === 0 && (isLoading || isBootstrappingInitialLoad);

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

  const isAllSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((option) => selectedValues.includes(option));

  const contentMode = resolveContentMode({
    filteredOptionsCount: filteredOptions.length,
    isInitialLoading,
  });

  return {
    contentMode,
    filteredOptions,
    isAllSelected,
    isLoadingOptions,
    shouldShowSelectAll,
    totalItems,
  };
};
