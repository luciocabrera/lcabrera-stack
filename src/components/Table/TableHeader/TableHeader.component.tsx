import * as stylex from '@stylexjs/stylex';
import { useCallback, useMemo } from 'react';

import type { ColumnFilter } from '@/types/filterOperators.types';

import { useRenderTracker } from '@/utils/performance';

import type {
  HandleResizeParams,
  HandleSortParams,
  TableHeaderProps,
} from './TableHeader.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.constants';
import {
  useClearColumnFilter,
  useColumnFilters,
  useColumnOrder,
  useColumnSizing,
  useColumnVisibility,
  useSetColumnFilter,
  useSetColumnSizing,
  useSetSorting,
  useSorting,
} from '../TableContext';
import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>>({
  columns,
  customStylex,
  data,
  isLoading = false,
  ...rest
}: TableHeaderProps<TData>) => {
  useRenderTracker('TableHeader');
  const [columnSizing] = useColumnSizing<TData>();
  const [sorting] = useSorting<TData>();
  const [columnOrder] = useColumnOrder<TData>();
  const [columnVisibility] = useColumnVisibility<TData>();
  const [columnFilters] = useColumnFilters<TData>();
  const setColumnSizing = useSetColumnSizing();
  const setSorting = useSetSorting();
  const setColumnFilter = useSetColumnFilter();
  const clearColumnFilter = useClearColumnFilter();

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

  const handleResize = ({ columnKey, width }: HandleResizeParams) => {
    setColumnSizing({ columnKey, width });
  };

  const handleResizeDoubleClick = (columnKey: string) => {
    setColumnSizing({ columnKey, width: undefined });
  };

  const handleSort = useCallback(
    ({ columnKey, direction, isMultiSort }: HandleSortParams) => {
      if (isMultiSort) {
        // Multi-column sorting: add or update this column
        const existingIndex = sorting.findIndex(
          (s) => s.columnKey === columnKey,
        );

        if (existingIndex === -1) {
          // Add new sort
          setSorting([...sorting, { columnKey, direction }]);
        } else {
          // Update existing sort
          const newSorting = [...sorting];
          newSorting[existingIndex] = { columnKey, direction };
          setSorting(newSorting);
        }
      } else {
        // Single-column sorting: replace existing sorts
        setSorting([{ columnKey, direction }]);
      }
    },
    [setSorting, sorting],
  );

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
              filter={columnFilters[col.key] as ColumnFilter | undefined}
              filterOptions={columnFilterOptions[col.key]}
              hasSettings
              isFilterable={col.isFilterable !== false}
              isLoading={isLoading}
              isSortable={col.isSortable !== false}
              key={col.key}
              label={col.label}
              maxWidth={col.maxWidth}
              minWidth={effectiveMinWidth}
              onFilterApply={(filter) => {
                setColumnFilter({ columnKey: col.key, filter });
              }}
              onFilterClear={() => {
                clearColumnFilter(col.key);
              }}
              onResize={handleResize}
              onResizeDoubleClick={handleResizeDoubleClick}
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
