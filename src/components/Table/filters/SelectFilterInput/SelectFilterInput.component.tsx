import { useCallback } from 'react';

import type { FilterOptionsResponse } from '@/components/Table/Table.types';

import {
  useFetchFilterData,
  useFetchMoreFilterData,
} from '@/components/Table/contexts/FiltersData/filters/actions';
import { useGetFilterData } from '@/components/Table/contexts/FiltersData/filters/selectors';
import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors';
import { VirtualList } from '@/components/VirtualList';

import type { SelectFilterInputProps } from './SelectFilterInput.types';

/** Pure value selector (checkboxes list) - operator is controlled by FilterInputs */
export const SelectFilterInput = <TData,>({
  columnKey,
  filter,
  listMaxHeight,
  onChange,
}: SelectFilterInputProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);
  const filterData = useGetFilterData<TData>(columnKey);

  const fetchFilterData = useFetchFilterData<string, FilterOptionsResponse>(
    columnKey,
  );
  const fetchMoreFilterData = useFetchMoreFilterData<
    string,
    FilterOptionsResponse
  >(columnKey);

  const handleFetchInitial = useCallback(async () => {
    if (!column.fetchFilterOptions) return;
    await fetchFilterData({
      dataSelector: column.filterOptionsDataSelector,
      dataTotalSelector: column.filterOptionsDataTotalSelector,
      onLoadMore: column.fetchFilterOptions,
    });
  }, [
    column.fetchFilterOptions,
    column.filterOptionsDataSelector,
    column.filterOptionsDataTotalSelector,
    fetchFilterData,
  ]);

  const handleFetchMore = useCallback(async () => {
    if (!column.fetchFilterOptions) return;
    await fetchMoreFilterData({
      dataSelector: column.filterOptionsDataSelector,
      dataTotalSelector: column.filterOptionsDataTotalSelector,
      onLoadMore: column.fetchFilterOptions,
    });
  }, [
    column.fetchFilterOptions,
    column.filterOptionsDataSelector,
    column.filterOptionsDataTotalSelector,
    fetchMoreFilterData,
  ]);

  return (
    <VirtualList
      dataState={filterData}
      filter={filter}
      listMaxHeight={listMaxHeight}
      name={`filter-search-${columnKey}`}
      onChange={onChange}
      onFetchInitial={
        column.fetchFilterOptions ? handleFetchInitial : undefined
      }
      onFetchMore={column.fetchFilterOptions ? handleFetchMore : undefined}
    />
  );
};
