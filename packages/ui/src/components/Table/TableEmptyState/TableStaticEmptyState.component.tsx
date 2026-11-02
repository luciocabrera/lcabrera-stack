import * as stylex from '@stylexjs/stylex';

import { useGetPinnedColumnPartition } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { countRenderedColumns } from '#ui/components/Table/utils/countRenderedColumns.util';

import { styles } from './TableEmptyState.stylex';
import { TableEmptyStateBody } from './TableEmptyStateBody.component';

export const TableStaticEmptyState = () => (
  <tr {...stylex.props(styles.row)}>
    <td
      colSpan={countRenderedColumns(useGetPinnedColumnPartition())}
      {...stylex.props(styles.cell)}
    >
      <div
        data-testid='table-empty-state-viewport'
        {...stylex.props(styles.staticViewport)}
      >
        <TableEmptyStateBody />
      </div>
    </td>
  </tr>
);
