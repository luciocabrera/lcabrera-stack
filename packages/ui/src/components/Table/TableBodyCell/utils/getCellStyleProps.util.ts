import * as stylex from '@stylexjs/stylex';

import type { TableColumnDataType } from '@repo/ui/components/Table/Table.types';

import type { TableBodyCellProps } from '../TableBodyCell.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

const isRightAlignedDataType = (dataType: TableColumnDataType): boolean =>
  dataType === 'number' || dataType === 'currency';

const isCenteredDataType = (dataType: TableColumnDataType): boolean =>
  dataType === 'boolean' || dataType === 'date';

type GetCellStylePropsArgs = Pick<
  TableBodyCellProps<Record<string, unknown>>,
  'customStylex' | 'minWidth' | 'pinInfo' | 'width'
> & {
  readonly dataType: TableColumnDataType;
  readonly hasCustomContent: boolean;
};

export const getCellStyleProps = ({
  customStylex,
  dataType,
  hasCustomContent,
  minWidth,
  pinInfo,
  width,
}: GetCellStylePropsArgs) => {
  const isRightAligned = !hasCustomContent && isRightAlignedDataType(dataType);
  const isCentered = !hasCustomContent && isCenteredDataType(dataType);

  return stylex.props(
    tableBodyCellStyles.base(minWidth, width),
    isRightAligned && tableBodyCellStyles.alignRight,
    isCentered && tableBodyCellStyles.alignCenter,
    pinInfo?.side === 'left' && tableBodyCellStyles.pinnedLeft(pinInfo.offset),
    pinInfo?.side === 'right' &&
      tableBodyCellStyles.pinnedRight(pinInfo.offset),
    pinInfo?.isLastPinnedLeft && tableBodyCellStyles.pinnedShadowLeft,
    pinInfo?.isFirstPinnedRight && tableBodyCellStyles.pinnedShadowRight,
    customStylex,
  );
};
