import * as stylex from '@stylexjs/stylex';

import { useGetTableRowHeight } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { TableRowProps } from './TableRow.types';

import { tableRowStyles } from './TableRow.stylex';

/**
 * It is written once here rather than at each call site so no row can be added without it
 * (ADR-062).
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
