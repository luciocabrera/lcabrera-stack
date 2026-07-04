import type { PinnedColumnInfo } from '@repo/ui/components/Table/Table.types';

import { tableHeaderCellStyles } from '../TableHeaderCell.stylex';

export const getShadowStyle = (pinInfo?: PinnedColumnInfo) => {
  if (pinInfo?.isLastPinnedLeft) return tableHeaderCellStyles.pinnedShadowLeft;
  if (pinInfo?.isFirstPinnedRight)
    return tableHeaderCellStyles.pinnedShadowRight;
};
