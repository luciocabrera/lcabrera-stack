import * as stylex from '@stylexjs/stylex';

import { useGetPinnedColumnPartition } from '#ui/components/Table/contexts/TableConfig/columns/selectors';

import type { TableFooterProps } from './TableFooter.types';

import { styles } from './TableFooter.stylex';

export const TableFooter = ({ children }: TableFooterProps) => {
  const { centerCols, leftPinnedCols, rightPinnedCols } =
    useGetPinnedColumnPartition();
  const colSpan =
    leftPinnedCols.length + centerCols.length + rightPinnedCols.length;

  return (
    <tfoot data-testid='table-footer' {...stylex.props(styles.footer)}>
      <tr {...stylex.props(styles.row)}>
        <td colSpan={colSpan} {...stylex.props(styles.cell)}>
          {children}
        </td>
      </tr>
    </tfoot>
  );
};
