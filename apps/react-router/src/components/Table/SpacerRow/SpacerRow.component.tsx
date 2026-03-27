import * as stylex from "@stylexjs/stylex";

import type { SpacerRowProps } from "./SpacerRow.types.ts";

import { styles } from "./SpacerRow.stylex.ts";
import { useGetColumnGroups } from "../contexts/TableConfig/columns/selectors/index.ts";

export const SpacerRow = ({ height }: SpacerRowProps) => {
  const { centerCols, leftPinnedCols, rightPinnedCols } = useGetColumnGroups();
  const colSpan = leftPinnedCols.length + centerCols.length + rightPinnedCols.length;

  return (
    <tr aria-hidden="true" {...stylex.props(styles.row(height))}>
      <td colSpan={colSpan} {...stylex.props(styles.cell(height))} />
    </tr>
  );
};
