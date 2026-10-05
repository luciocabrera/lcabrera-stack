import * as stylex from '@stylexjs/stylex';

import type { TableCellBadgeProps } from './TableCellBadge.types';

import { styles } from './TableCellBadge.stylex';

export const TableCellBadge = ({ children, tone }: TableCellBadgeProps) => (
  <span {...stylex.props(styles.cell)}>
    <span
      data-testid='table-cell-badge'
      title={typeof children === 'string' ? children : undefined}
      {...stylex.props(styles.pill, styles.tone(tone.background, tone.text))}
    >
      {children}
    </span>
  </span>
);
