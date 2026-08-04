import * as stylex from '@stylexjs/stylex';

import type { SpacerRowProps } from './SpacerRow.types';

import { useGetPinnedColumnPartition } from '../contexts/TableConfig/columns/selectors';
import { styles } from './SpacerRow.stylex';

export const SpacerRow = ({ height }: SpacerRowProps) => {
  const { centerCols, leftPinnedCols, rightPinnedCols } =
    useGetPinnedColumnPartition();
  const colSpan =
    leftPinnedCols.length + centerCols.length + rightPinnedCols.length;

  return (
    // Decorative: one empty colSpan'd cell, no focusable descendant, so
    // aria-hidden is correct. a11y engines flag it anyway because they cannot
    // see the subtree is empty — the Biome exemption is argued in
    // docs/agents/public-package-suppressions.json.
    <tr aria-hidden='true' {...stylex.props(styles.row(height))}>
      <td colSpan={colSpan} {...stylex.props(styles.cell(height))} />
    </tr>
  );
};
