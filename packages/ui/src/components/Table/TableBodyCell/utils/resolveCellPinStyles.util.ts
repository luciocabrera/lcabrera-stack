import type { PinnedColumnInfo } from '#ui/components/Table/Table.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

export const resolveCellPinStyles = (pinInfo: PinnedColumnInfo | undefined) => [
  pinInfo?.side === 'left' && tableBodyCellStyles.pinnedLeft(pinInfo.offset),
  pinInfo?.side === 'right' && tableBodyCellStyles.pinnedRight(pinInfo.offset),
  pinInfo?.isLastPinnedLeft && tableBodyCellStyles.pinnedShadowLeft,
  pinInfo?.isFirstPinnedRight && tableBodyCellStyles.pinnedShadowRight,
];
