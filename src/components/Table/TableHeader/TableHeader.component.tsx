import * as stylex from '@stylexjs/stylex';
import { useCallback } from 'react';

import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import {
  useColumnSizing,
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
  const setColumnSizing = useSetColumnSizing();
  const setSorting = useSetSorting();

  const handleResize = ({ columnKey, width }: HandleResizeParams) => {
    setColumnSizing({ columnKey, width });
  };

  const handleResizeDoubleClick = (columnKey: string) => {
    setColumnSizing({ columnKey, width: undefined });
  };

  const handleSort = useCallback(
    ({ columnKey, direction }: HandleSortParams) => {
      // Single-column sorting: replace existing sorts
      const newSorting = [{ columnKey, direction }];
      setSorting(newSorting);
    },
    [setSorting],
  );

  return (
    <thead
      data-testid='table-header'
      {...rest}
      {...stylex.props(tableHeaderStyles.container, customStylex)}
    >
      <TableRow isHeader>
        {columns.map((col) => {
          const finalWidth = columnSizing[col.key];
          const effectiveMinWidth = col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;

          // Find current sort for this column
          const currentSort = sorting.find((s) => s.columnKey === col.key);
          const sortDirection = currentSort?.direction;

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
              width={finalWidth ?? effectiveMinWidth}
            />
          );
        })}
      </TableRow>
    </thead>
  );
};
