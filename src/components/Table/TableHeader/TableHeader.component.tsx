import * as stylex from '@stylexjs/stylex';

import type { TableHeaderProps } from './TableHeader.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.types';
import {
  useColumnSizing,
  useSetColumnSizing,
} from '../TableContext/hooks';
import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>>({
  columns,
  customStylex,
  isLoading = false,
  ...rest
}: TableHeaderProps<TData>) => {
  const [columnSizing] = useColumnSizing<TData>();
  const setColumnSizing = useSetColumnSizing();

  const handleResize = (columnKey: string, width: number) => {
    setColumnSizing(columnKey, width);
  };

  const handleResizeDoubleClick = (columnKey: string) => {
    setColumnSizing(columnKey, undefined);
  };

  return (
    <thead
      data-testid='table-header'
      {...rest}
      {...stylex.props(tableHeaderStyles.container, customStylex)}
    >
      <TableRow isHeader>
        {columns.map((col) => {
          const finalWidth =
            columnSizing[col.key] ?? col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;

          return (
            <TableHeaderCell
              columnKey={col.key}
              hasSettings
              isLoading={isLoading}
              isSortable
              key={col.key}
              label={col.label}
              maxWidth={col.maxWidth}
              minWidth={col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH}
              onResize={handleResize}
              onResizeDoubleClick={handleResizeDoubleClick}
              width={finalWidth}
            />
          );
        })}
      </TableRow>
    </thead>
  );
};
