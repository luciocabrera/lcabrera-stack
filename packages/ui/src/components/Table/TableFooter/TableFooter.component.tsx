import * as stylex from '@stylexjs/stylex';

import { useGetPinnedColumnPartition } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useGetTableTotalRows } from '#ui/components/Table/contexts/TableData/data/selectors';
import { useTableGroupTree } from '#ui/components/Table/hooks/useTableGroupTree.hook';
import { countRenderedColumns } from '#ui/components/Table/utils/countRenderedColumns.util';
import { resolveFooterAriaRowIndex } from '#ui/components/Table/utils/resolveFooterAriaRowIndex.util';

import type { TableFooterProps } from './TableFooter.types';

import { styles } from './TableFooter.stylex';

export const TableFooter = ({ children }: TableFooterProps) => {
  const colSpan = countRenderedColumns(useGetPinnedColumnPartition());
  const totalRows = useGetTableTotalRows();
  const { isTreeGrid, rows } = useTableGroupTree();

  return (
    <tfoot data-testid='table-footer' {...stylex.props(styles.footer)}>
      <tr
        aria-rowindex={resolveFooterAriaRowIndex({
          totalRows: isTreeGrid ? rows.length : totalRows,
        })}
        {...stylex.props(styles.row)}
      >
        <td colSpan={colSpan} {...stylex.props(styles.cell)}>
          {children}
        </td>
      </tr>
    </tfoot>
  );
};
