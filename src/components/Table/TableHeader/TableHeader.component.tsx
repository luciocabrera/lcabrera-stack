import * as stylex from '@stylexjs/stylex';

import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import {
  useColumnSizing,
  useSetColumnSizing,
} from '@/components/Table/TableContext/hooks';
import { TableHeaderCell } from '@/components/Table/TableHeaderCell';
import { TableRow } from '@/components/Table/TableRow';

import type { HandleResizeParams, TableHeaderProps } from './TableHeader.types';

import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>>({
  columns,
  customStylex,
  isLoading = false,
  ...rest
}: TableHeaderProps<TData>) => {
  const [columnSizing] = useColumnSizing<TData>();
  const setColumnSizing = useSetColumnSizing();

  const handleResize = ({ columnKey, width }: HandleResizeParams) => {
    setColumnSizing({ columnKey, width });
  };

  const handleResizeDoubleClick = (columnKey: string) => {
    setColumnSizing({ columnKey, width: undefined });
  };

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

          return (
            <TableHeaderCell
              columnKey={col.key}
              hasSettings
              isLoading={isLoading}
              isSortable
              key={col.key}
              label={col.label}
              maxWidth={col.maxWidth}
              minWidth={effectiveMinWidth}
              onResize={handleResize}
              onResizeDoubleClick={handleResizeDoubleClick}
              width={finalWidth ?? effectiveMinWidth}
            />
          );
        })}
      </TableRow>
    </thead>
  );
};
