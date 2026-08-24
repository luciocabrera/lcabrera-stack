import * as stylex from '@stylexjs/stylex';

import { useGetTableRowHeight } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { TableRowProps } from './TableRow.types';

import { tableRowStyles } from './TableRow.stylex';

/**
 * `role='row'` is set after `{...rest}` because `display: flex` drops the implicit table
 * role, and a caller must not be able to replace it (ADR-062).
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
