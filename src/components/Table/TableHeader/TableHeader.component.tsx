import * as stylex from '@stylexjs/stylex';
import { useCallback } from 'react';

import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import {
  useColumnOrder,
  useColumnSizing,
  useColumnVisibility,
  useSetColumnSizing,
  useSetSorting,
  useSorting,
} from '@/components/Table/TableContext/hooks';
import { TableHeaderCell } from '@/components/Table/TableHeaderCell';
import { TableRow } from '@/components/Table/TableRow';

import type { HandleResizeParams, HandleSortParams, TableHeaderProps } from './TableHeader.types';

import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>>({
  columns,
  customStylex,
  isLoading = false,
  ...rest
}: TableHeaderProps<TData>) => {
  const [columnSizing] = useColumnSizing<TData>();
  const [sorting] = useSorting<TData>();
  const [columnOrder] = useColumnOrder<TData>();
  const [columnVisibility] = useColumnVisibility<TData>();
  const setColumnSizing = useSetColumnSizing();
  const setSorting = useSetSorting();

  // Filter visible columns
  const visibleColumns = columns.filter((col) => !columnVisibility.has(col.key));

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
        const existingIndex = sorting.findIndex((s) => s.columnKey === columnKey);
        
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
          const sortIndex = currentSort ? sorting.indexOf(currentSort) : undefined;

          return (
            <TableHeaderCell
              columnKey={col.key}
              hasSettings
              isLoading={isLoading}
              isSortable={col.isSortable !== false}
              key={col.key}
              label={col.label}
              maxWidth={col.maxWidth}
              minWidth={effectiveMinWidth}
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
