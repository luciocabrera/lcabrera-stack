import type { PinnedColumnInfo } from '@lcabrera/ui/components/Table/Table.types';

import { tableHeaderCellStyles } from '../TableHeaderCell.stylex';

export const getPinnedStyle = (pinInfo?: PinnedColumnInfo) => {
  if (pinInfo?.side === 'left')
    return tableHeaderCellStyles.pinnedLeft(pinInfo.offset);
  if (pinInfo?.side === 'right')
    return tableHeaderCellStyles.pinnedRight(pinInfo.offset);
};
