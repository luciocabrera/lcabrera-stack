import { useCallback, useMemo } from 'react';

import type { FilterOptionsResponse } from '@/components/Table/Table.types';

import {
  useFetchFilterData,
  useFetchMoreFilterData,
} from '@/components/Table/contexts/FiltersData/filters/actions';
import { useGetFilterData } from '@/components/Table/contexts/FiltersData/filters/selectors';
import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors';
import { VirtualSelect } from '@/components/VirtualSelect';

import type { SelectFilterInputProps } from './SelectFilterInput.types';

import { styles } from './SelectFilterInput.stylex';

/** Pure value selector (checkboxes list) - operator is controlled by FilterInputs */
export const SelectFilterInput = <TData,>({
  columnKey,
  filter,
  listMaxHeight,
  onChange,
  shouldFillHeight = false,
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

  const selectedValues = useMemo(() => filter?.values ?? [], [filter?.values]);

  // Map FilterData → VirtualListDataState (totalRows → totalCount)
  const dataState = useMemo(
    () => ({
      data: filterData.data,
      hasMore: filterData.hasMore,
      isLoading: filterData.isLoading,
      isLoadingMore: filterData.isLoadingMore,
      totalCount: filterData.totalRows,
    }),
    [filterData],
  );

  const handleChange = useCallback(
    (selected: string[]) => {
      onChange({ type: 'select', values: selected });
    },
    [onChange],
  );

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
