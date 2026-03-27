import type { PinnedColumnInfo } from "@/components/Table/Table.types";

import { tableHeaderCellStyles } from "../TableHeaderCell.stylex.ts";

export const getPinnedStyle = (pinInfo?: PinnedColumnInfo) => {
  if (pinInfo?.side === "left") return tableHeaderCellStyles.pinnedLeft(pinInfo.offset);
  if (pinInfo?.side === "right") return tableHeaderCellStyles.pinnedRight(pinInfo.offset);
};
