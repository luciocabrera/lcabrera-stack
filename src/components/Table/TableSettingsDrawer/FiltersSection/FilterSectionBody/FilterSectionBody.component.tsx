import { FilterInputs } from '@/components/Table/TableHeaderCell/filters/FilterInputs';
import { useGetNormalizedColumn } from '@/components/Table/TableContext/hooks/store/columns/selectors';
import { useFetchFilterData } from '@/components/Table/TableContext/hooks/store/filters/actions';
import { useEffect } from 'react';
import type { FilterSectionBodyProps } from './FilterSectionBody.types';

/**
 * Wraps FilterInputs with fetch-on-mount behavior for the drawer.
 * Uses the same FilterInputs shared with FilterPopover — no extra wrapper.
 */
export const FilterSectionBody = <TData,>({
  columnKey,
  filter,
  onChange,
}: FilterSectionBodyProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);
  const fetchFilterData = useFetchFilterData<string, unknown>(columnKey);

  useEffect(() => {
    // Fetch filter data when component mounts if column has fetchFilterOptions
    if (column.fetchFilterOptions) {
      void fetchFilterData({
        dataSelector: column.filterOptionsDataSelector,
        dataTotalSelector: column.filterOptionsDataTotalSelector,
        onLoadMore: column.fetchFilterOptions,
      });
    }
  }, [
    column.fetchFilterOptions,
    column.filterOptionsDataSelector,
    column.filterOptionsDataTotalSelector,
    fetchFilterData,
  ]);

  return (
    <FilterInputs
      columnKey={columnKey}
      filter={filter}
      onChange={onChange}
    />
  );
};
