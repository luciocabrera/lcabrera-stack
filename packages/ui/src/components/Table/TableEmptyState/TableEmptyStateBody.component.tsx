import * as stylex from '@stylexjs/stylex';

import { NoDataDescriptive } from '#ui/components/Icons';

import { styles } from './TableEmptyState.stylex';
import { TableEmptyStateAction } from './TableEmptyStateAction/TableEmptyStateAction.component';
import { TableEmptyStateMessage } from './TableEmptyStateMessage/TableEmptyStateMessage.component';

export const TableEmptyStateBody = () => (
  <div {...stylex.props(styles.content)}>
    <div {...stylex.props(styles.illustration)}>
      <NoDataDescriptive />
    </div>
    <TableEmptyStateMessage />
    <TableEmptyStateAction />
  </div>
);
