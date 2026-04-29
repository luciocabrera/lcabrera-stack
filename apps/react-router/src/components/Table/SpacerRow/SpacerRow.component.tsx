import * as stylex from '@stylexjs/stylex';

import type { SpacerRowProps } from './SpacerRow.types';

import { styles } from './SpacerRow.stylex';
import { useGetColumnGroups } from '../contexts/TableConfig/columns/selectors';

export const SpacerRow = ({ height }: SpacerRowProps) => {
  const { centerCols, leftPinnedCols, rightPinnedCols } = useGetColumnGroups();
  const colSpan =
    leftPinnedCols.length + centerCols.length + rightPinnedCols.length;

  return (
    // Decorative spacer row: no interactive descendants are rendered here.
    // NOSONAR
    <tr aria-hidden='true' {...stylex.props(styles.row(height))}>
      <td colSpan={colSpan} {...stylex.props(styles.cell(height))} />
    </tr>
  );
};
