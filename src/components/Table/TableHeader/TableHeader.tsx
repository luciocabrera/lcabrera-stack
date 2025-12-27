import * as stylex from '@stylexjs/stylex';

import type { TableHeaderProps } from './TableHeader.types';

import { TableCell } from '../TableCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = ({
  columns,
  customStylex,
  ...rest
}: TableHeaderProps) => (
  <thead
    data-testid="table-header"
    {...rest}
    {...stylex.props(
      tableHeaderStyles.container,
      customStylex,
    )}
  >
    <TableRow isHeader>
      {columns.map((col) => (
        <TableCell isHeader isSticky key={col.key} minWidth={col.minWidth ?? 120}>
          {col.label}
        </TableCell>
      ))}
    </TableRow>
  </thead>
);
