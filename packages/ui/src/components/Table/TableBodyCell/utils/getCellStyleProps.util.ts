import * as stylex from '@stylexjs/stylex';

import type { TableColumnDataType } from '#ui/components/Table/Table.types';

import type { TableBodyCellProps } from '../TableBodyCell.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

const isRightAlignedDataType = (dataType: TableColumnDataType) =>
  dataType === 'number' || dataType === 'currency';

const isCenteredDataType = (dataType: TableColumnDataType) =>
  dataType === 'boolean' || dataType === 'date';

type GetCellStylePropsArgs = Pick<
  TableBodyCellProps<Record<string, unknown>>,
  'customStylex' | 'minWidth' | 'pinInfo' | 'width'
> & {
  readonly dataType: TableColumnDataType;
  /**
   * Whether the column's type decides where this cell's content sits. Deliberately not
   * "does the cell hold custom content": one flag used to answer both, so every
   * grid-supplied group-row cell inherited the opt-out written for a consumer's own
   * `render()` output and a currency total sat at the left edge of a right-aligned column
   * (#1018). `TableBodyCell` owns the question; this only applies the answer.
   */
  readonly isAlignedByDataType: boolean;
};

export const getCellStyleProps = ({
  customStylex,
  dataType,
  isAlignedByDataType,
  minWidth,
  pinInfo,
  width,
}: GetCellStylePropsArgs) => {
  const isRightAligned =
    isAlignedByDataType && isRightAlignedDataType(dataType);
  const isCentered = isAlignedByDataType && isCenteredDataType(dataType);

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
