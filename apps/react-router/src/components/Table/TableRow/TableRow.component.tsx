import * as stylex from "@stylexjs/stylex";

import type { TableRowProps } from "./TableRow.types.ts";

import { tableRowStyles } from "./TableRow.stylex.ts";

export const TableRow = ({
  children,
  customStylex,
  isHeader = false,
  isStriped = true,
  ...rest
}: TableRowProps) => {
  return (
    <tr
      {...rest}
      {...stylex.props(
        tableRowStyles.base,

        isStriped && tableRowStyles.striped,
        isHeader && tableRowStyles.header,
        customStylex,
      )}
    >
      {children}
    </tr>
  );
};
