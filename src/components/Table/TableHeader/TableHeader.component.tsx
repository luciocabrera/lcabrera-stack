import * as stylex from '@stylexjs/stylex';
import { useMemo } from 'react';

import {
  useGetColumnFilters,
  useGetColumns,
  useGetColumnSizing,
  useGetColumnsSorting,
  useGetEffectiveColumns,
} from '@/components/Table/TableContext/hooks/store/columns/selectors';
import { useRenderTracker } from '@/utils/performance';

import type { TableColumn } from '../Table.types';
import type { TableHeaderProps } from './TableHeader.types';

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

  const normalizedColumns = useMemo(() => {
    const cols = {} as Record<
      keyof TData | string,
      TableColumn<TData> & {
        sortDirection?: 'asc' | 'desc';
        sortIndex?: number;
      }
    >;
    for (const col of columns) {
      const currentSort = sorting.find((s) => s.columnKey === col.key);
      const sortDirection = currentSort?.direction;
      const sortIndex = currentSort ? sorting.indexOf(currentSort) : undefined;
      cols[col.key] = { ...col, sortDirection, sortIndex };
    }
    return cols;
  }, [columns, sorting]);

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
          const sortDirection = normalizedColumns[col.key]?.sortDirection;
          const sortIndex = normalizedColumns[col.key]?.sortIndex;

          return (
            <TableHeaderCell
              columnKey={col.key}
              dataType={col.dataType}
              fetchFilterOptions={col.fetchFilterOptions}
              filter={columnFilters[col.key]}
              filterOptions={normalizedColumns[col.key]?.filterOptions}
              hasSettings
              isFilterable={col.isFilterable !== false}
              isSortable={col.isSortable !== false}
              key={col.key}
              label={col.label}
              maxWidth={col.maxWidth}
              minWidth={effectiveMinWidth}
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
