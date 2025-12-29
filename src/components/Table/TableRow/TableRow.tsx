import * as stylex from '@stylexjs/stylex';

import type { TableRowProps } from './TableRow.types';

import { tableRowStyles } from './TableRow.stylex';

export const TableRow = ({
  children,
  customStylex,
  isHeader = false,
  isStriped = true,
  ...rest
}: TableRowProps) => {
  return (
    <tr
      {...rest}
      {...stylex.props(
        tableRowStyles.base,
        isHeader && tableRowStyles.header,
        isStriped && tableRowStyles.striped,
        customStylex,
      )}
    >
      {children}
    </tr>
  );
};
