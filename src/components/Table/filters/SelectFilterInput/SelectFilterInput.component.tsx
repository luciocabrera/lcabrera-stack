import { useRef } from 'react';

import type { FilterOptionsResponse } from '@/components/Table/Table.types';
import type { PrefetchCache } from '@/types/ui.types';

import { useFetchFilterData } from '@/components/Table/contexts/FiltersData/filters/actions';
import { useGetFilterData } from '@/components/Table/contexts/FiltersData/filters/selectors';
import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors';
import { VirtualSelect } from '@/components/VirtualSelect';

import type { SelectFilterInputProps } from './SelectFilterInput.types';

import { styles } from './SelectFilterInput.stylex';
export const SelectFilterInput = <TData,>({
  columnKey,
  filter,
  listMaxHeight,
  onChange,
  shouldFillHeight = false,
}: SelectFilterInputProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);
  const filterData = useGetFilterData<TData>(columnKey);

  const prefetchRef = useRef<PrefetchCache<FilterOptionsResponse>>({
    data: undefined,
    promise: undefined,
    skip: -1,
  });

  const { fetchInitial, fetchMore } = useFetchFilterData<
    TData,
    FilterOptionsResponse
  >({ columnKey, prefetchRef });

  const handleFetchInitial = async () => {
    if (!column.fetchFilterOptions) return;
    await fetchInitial({
      dataSelector: column.filterOptionsDataSelector,
      dataTotalSelector: column.filterOptionsDataTotalSelector,
      onLoadMore: column.fetchFilterOptions,
    });
  };

  const handleFetchMore = async () => {
    if (!column.fetchFilterOptions) return;
    await fetchMore({
      dataSelector: column.filterOptionsDataSelector,
      dataTotalSelector: column.filterOptionsDataTotalSelector,
      onLoadMore: column.fetchFilterOptions,
    });
  };

  const selectedValues = filter?.values ?? [];

  // Map FilterData → VirtualListDataState (totalRows → totalCount)
  const dataState = {
    data: filterData.data,
    hasMore: filterData.hasMore,
    isLoading: filterData.isLoading,
    isLoadingMore: filterData.isLoadingMore,
    totalCount: filterData.totalRows,
  };

  const handleChange = (selected: string[]) => {
    onChange({ type: 'select', values: selected });
  };

  return (
    <VirtualSelect
      customStylex={styles.selectOverride}
      dataState={dataState}
      isAlwaysOpen
      listMaxHeight={listMaxHeight}
      mode='multi'
      onChange={handleChange}
      onFetchInitial={handleFetchInitial}
      onFetchMore={handleFetchMore}
      selected={selectedValues}
      shouldFillHeight={shouldFillHeight}
    />
  );
};
