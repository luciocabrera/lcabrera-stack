import * as stylex from '@stylexjs/stylex';

import { tableBodyCellStyles } from '#ui/components/Table/TableBodyCell/TableBodyCell.stylex';

import type { TableCellTextProps } from './TableCellText.types';

import { styles } from './TableCellText.stylex';

export const TableCellText = ({
  children,
  isMonospace = false,
  weight = 'regular',
}: TableCellTextProps) => (
  <span
    title={typeof children === 'string' ? children : undefined}
    {...stylex.props(
      tableBodyCellStyles.textContent,
      isMonospace && styles.monospace,
      weight === 'bold' && styles.bold,
    )}
  >
    {children}
  </span>
);
