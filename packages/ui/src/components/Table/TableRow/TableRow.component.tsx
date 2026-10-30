import * as stylex from '@stylexjs/stylex';

import {
  useGetTableHeaderRowHeight,
  useGetTableRowHeight,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { TableRowProps } from './TableRow.types';

import { tableRowStyles } from './TableRow.stylex';

export const TableRow = ({
  children,
  customStylex,
  isHeader = false,
  isStriped = true,
  ...rest
}: TableRowProps) => {
  const bodyRowHeight = useGetTableRowHeight();
  const headerRowHeight = useGetTableHeaderRowHeight();
  const rowHeight = isHeader ? headerRowHeight : bodyRowHeight;

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
