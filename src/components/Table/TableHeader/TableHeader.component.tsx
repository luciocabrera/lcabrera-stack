import * as stylex from '@stylexjs/stylex';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useSetColumnsSorting } from '@/components/Table/TableContext/hooks/store/columns/actions';
import {
  useGetColumnFilters,
  useGetColumns,
  useGetColumnSizing,
  useGetColumnsSorting,
  useGetEffectiveColumns,
} from '@/components/Table/TableContext/hooks/store/columns/selectors';
import { useRenderTracker } from '@/utils/performance';

import type { HandleSortParams, TableHeaderProps } from './TableHeader.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.constants';
import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>, TResponse>({
  customStylex,
  ...rest
}: TableHeaderProps<TData, TResponse>) => {
  useRenderTracker('TableHeader');

  const columns = useGetColumns<TData>();
  const columnSizing = useGetColumnSizing();
  const sorting = useGetColumnsSorting();
  const effectiveColumns = useGetEffectiveColumns();
  const columnFilters = useGetColumnFilters();

  const [, setSearchParams] = useSearchParams();
  const setSorting = useSetColumnsSorting();

  const handleSort = ({ columnKey, direction }: HandleSortParams) => {
    const currentSort = sorting.find((s) => s.columnKey === columnKey);
    if (currentSort && currentSort.direction === direction) {
      // No change in sort
      return;
    }
    const newSorting = sorting.filter((s) => s.columnKey !== columnKey);
    if (direction) {
      newSorting.push({ columnKey, direction });
    }

    setSearchParams((params) => {
      console.log('[handleSortChange] Setting URL params, sorting.length:', {
        newSorting,
        sorting,
      });
      if (newSorting.length > 0) {
        params.set('sort', JSON.stringify(newSorting));
      } else {
        params.delete('sort');
      }
      return params;
    });
    setSorting(newSorting);
  };

  // Calculate unique values for facet filters (client-side)
  // This creates a map of columnKey -> unique values from the data
  const columnFilterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};

    for (const col of columns) {
      // Only calculate for filterable columns
      if (col.isFilterable === false) continue;

      // Use provided filterOptions if available
      if (col.filterOptions) {
        options[col.key] = col.filterOptions;
        continue;
      }

    }

    return options;
  }, [columns]);

  return (
    <thead
      data-testid='table-header'
      {...rest}
      {...stylex.props(tableHeaderStyles.container, customStylex)}
    >
      <TableRow isHeader>
        {effectiveColumns.map((col) => {
          const finalWidth = columnSizing[col.key];
          const effectiveMinWidth = col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;

          // Find current sort for this column
          const currentSort = sorting.find((s) => s.columnKey === col.key);
          const sortDirection = currentSort?.direction;
          const sortIndex = currentSort
            ? sorting.indexOf(currentSort)
            : undefined;

          return (
            <TableHeaderCell
              columnKey={col.key}
              dataType={col.dataType}
              fetchFilterOptions={col.fetchFilterOptions}
              filter={columnFilters[col.key]}
              filterOptions={columnFilterOptions[col.key]}
              hasSettings
              isFilterable={col.isFilterable !== false}
              isSortable={col.isSortable !== false}
              key={col.key}
              label={col.label}
              maxWidth={col.maxWidth}
              minWidth={effectiveMinWidth}
              onSort={handleSort}
              sortDirection={sortDirection}
              sortIndex={sortIndex}
              width={finalWidth ?? effectiveMinWidth}
            />
          );
        })}
      </TableRow>
    </thead>
  );
};
