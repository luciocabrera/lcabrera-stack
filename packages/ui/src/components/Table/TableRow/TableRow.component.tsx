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
 *
 * It is set **after** `{...rest}`, unlike every other prop this component
 * forwards. The role is the row's only source of semantics, so a caller must
 * not be able to replace it by passing one — accidentally or otherwise. What
 * looks like a spread-order detail is the difference between a contract and a
 * default.
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
      {...rest}
      role='row'
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
