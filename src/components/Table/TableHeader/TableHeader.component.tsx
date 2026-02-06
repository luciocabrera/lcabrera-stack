import * as stylex from '@stylexjs/stylex';

import {
  useGetColumnFilters,
  useGetColumnSizing,
  useGetEffectiveColumns,
  useGetNormalizedColumns,
} from '@/components/Table/TableContext/hooks/store/columns/selectors';
import { useRenderTracker } from '@/utils/performance';

import type { TableHeaderProps } from './TableHeader.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.constants';
import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>, TResponse>({
  customStylex,
  ...rest
}: TableHeaderProps<TData, TResponse>) => {
  useRenderTracker({ componentName: 'TableHeader' });

  const columnFilters = useGetColumnFilters();
  const columnSizing = useGetColumnSizing();
  const effectiveColumns = useGetEffectiveColumns();
  const normalizedColumns = useGetNormalizedColumns();

  return (
    <thead
      data-testid='table-header'
      {...rest}
      {...stylex.props(tableHeaderStyles.container, customStylex)}
    >
      <TableRow isHeader>
        {effectiveColumns.map((col) => {
          const effectiveMinWidth = col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
          const finalWidth = columnSizing[col.key] ?? effectiveMinWidth;
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
              width={finalWidth}
            />
          );
        })}
      </TableRow>
    </thead>
  );
};
