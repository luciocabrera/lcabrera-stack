import * as stylex from '@stylexjs/stylex';

import { useGetTableRowHeight } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { TableRowProps } from './TableRow.types';

import { tableRowStyles } from './TableRow.stylex';

/**
 * Every row of the grid, header and body alike.
 *
 * `role='row'` is declared here because the implicit one is gone: this `<tr>`
 * is `display: flex` (see below), and a browser drops an element's implicit
 * table role along with its table `display`. It is written once here rather
 * than at each call site so no row can be added without it (ADR-062).
 */
export const TableRow = ({
  children,
  customStylex,
  isHeader = false,
  isStriped = true,
  ...rest
}: TableRowProps) => {
  const rowHeight = useGetTableRowHeight();

  return (
    <tr
      role='row'
      {...rest}
      {...stylex.props(
        tableRowStyles.base,
        tableRowStyles.height(rowHeight),
        isStriped && tableRowStyles.striped,
        isHeader && tableRowStyles.header,
        customStylex,
      )}
    >
      {children}
    </tr>
  );
};
