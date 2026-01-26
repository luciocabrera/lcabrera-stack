import * as stylex from '@stylexjs/stylex';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useRenderTracker } from '@/utils/performance';

import type { HandleSortParams, TableHeaderProps } from './TableHeader.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.constants';
import {
  useColumnFilters,
  useColumnOrder,
  useColumnSizing,
  useColumnVisibility,
  useSetSorting,
  useSorting,
} from '../TableContext';
import { useColumns } from '../TableContext/hooks/selectors.hooks';
import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>>({
  customStylex,
  data,
  isLoading = false,
  ...rest
}: TableHeaderProps<TData>) => {
  useRenderTracker('TableHeader');
  const [columns] = useColumns<TData>();
  const [, setSearchParams] = useSearchParams();
  const [columnSizing] = useColumnSizing<TData>();
  const [sorting] = useSorting<TData>();
  const [columnOrder] = useColumnOrder<TData>();
  const [columnVisibility] = useColumnVisibility<TData>();
  const [columnFilters] = useColumnFilters<TData>();
  const setSorting = useSetSorting();

  // Filter visible columns
  const visibleColumns = columns.filter(
    (col) => !columnVisibility.has(col.key),
  );

  // Apply column order
  const orderedColumns =
    columnOrder.length > 0
      ? [
          ...columnOrder
            .map((key) => visibleColumns.find((col) => col.key === key))
            .filter((col): col is NonNullable<typeof col> => col !== undefined),
          ...visibleColumns.filter((col) => !columnOrder.includes(col.key)),
        ]
      : visibleColumns;

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

      // Calculate from data for string/currency columns (client-side fallback)
      // Only if we have data loaded and no fetchFilterOptions function
      if (
        data.length > 0 &&
        !col.fetchFilterOptions &&
        (col.dataType === 'string' || col.dataType === 'currency')
      ) {
        const uniqueValues = new Set<string>();

        for (const row of data) {
          const value = row[col.key];
          if (value !== undefined && value !== null && value !== '') {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            uniqueValues.add(String(value));
          }
        }

        if (uniqueValues.size > 0 && uniqueValues.size <= 100) {
          // Only use facet filter if we have reasonable number of options
          options[col.key] = [...uniqueValues].toSorted();
        }
      }
    }

    return options;
  }, [columns, data]);

  return (
    <thead
      data-testid='table-header'
      {...rest}
      {...stylex.props(tableHeaderStyles.container, customStylex)}
    >
      <TableRow isHeader>
        {orderedColumns.map((col) => {
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
              isLoading={isLoading}
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
