import { useGetTableRowHeight } from '@repo/ui/components/Table/contexts/TableConfig/meta/selectors';
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
  const rowHeight = useGetTableRowHeight();

  return (
    <tr
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
