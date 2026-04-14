import * as stylex from '@stylexjs/stylex';

import type { SpacerCellProps } from './SpacerCell.types';

import { styles } from './SpacerCell.stylex';

/** Invisible spacer cell used for column virtualization. */
export const SpacerCell = ({ isHeader = false, width }: SpacerCellProps) => {
  if (isHeader) {
    return <th aria-hidden='true' {...stylex.props(styles.cell(width))} />;
  }

  return <td aria-hidden='true' {...stylex.props(styles.cell(width))} />;
};
