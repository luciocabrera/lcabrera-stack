import * as stylex from '@stylexjs/stylex';

import type { TableHeaderProps } from './TableHeader.types';

import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>>({
  columns,
  customStylex,
  ...rest
}: TableHeaderProps<TData>) => (
  <thead
    data-testid='table-header'
    {...rest}
    {...stylex.props(tableHeaderStyles.container, customStylex)}
  >
    <TableRow isHeader>
      {columns.map((col) => (
        <TableHeaderCell
          hasSettings
          isSortable
          key={col.key}
          label={col.label}
          minWidth={col.minWidth ?? 120}
        />
      ))}
    </TableRow>
  </thead>
);
