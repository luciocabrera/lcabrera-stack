import * as stylex from '@stylexjs/stylex';

import type { SpacerRowProps } from './SpacerRow.types';

import { styles } from './SpacerRow.stylex';

export const SpacerRow = ({ colSpan, height }: SpacerRowProps) => {
  return (
    <tr aria-hidden='true' {...stylex.props(styles.row(height))}>
      <td colSpan={colSpan} {...stylex.props(styles.cell(height))} />
    </tr>
  );
};
