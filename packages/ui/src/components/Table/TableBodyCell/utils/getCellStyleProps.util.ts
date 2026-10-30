import * as stylex from '@stylexjs/stylex';

import type {
  TableColumnAlign,
  TableColumnDataType,
} from '#ui/components/Table/Table.types';
import type { TableStaticColumnWidths } from '#ui/components/Table/utils/resolveStaticColumnWidths.util';

import type { TableBodyCellProps } from '../TableBodyCell.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

const isRightAlignedDataType = (dataType: TableColumnDataType) =>
  dataType === 'number' || dataType === 'currency';

const isCenteredDataType = (dataType: TableColumnDataType) =>
  dataType === 'boolean' || dataType === 'date';

const ALIGN_STYLES = {
  center: tableBodyCellStyles.alignCenter,
  end: tableBodyCellStyles.alignRight,
  start: tableBodyCellStyles.alignStart,
} as const;

type GetCellStylePropsArgs = Pick<
  TableBodyCellProps<Record<string, unknown>>,
  'customStylex' | 'minWidth' | 'pinInfo' | 'width'
> & {
  readonly align?: TableColumnAlign;
  readonly dataType: TableColumnDataType;
  readonly isAlignedByDataType: boolean;
  readonly isFill?: boolean;
  readonly staticWidths?: TableStaticColumnWidths;
};

const resolveLayoutStyles = ({
  align,
  isFill,
  staticWidths,
}: Pick<GetCellStylePropsArgs, 'align' | 'isFill' | 'staticWidths'>) =>
  [
    staticWidths !== undefined &&
      tableBodyCellStyles.staticLayout(staticWidths),
    align !== undefined && ALIGN_STYLES[align],
    isFill === true && tableBodyCellStyles.fill,
  ].filter(Boolean);

export const getCellStyleProps = ({
  align,
  customStylex,
  dataType,
  isAlignedByDataType,
  isFill,
  minWidth,
  pinInfo,
  staticWidths,
  width,
}: GetCellStylePropsArgs) => {
  const isByDataType = isAlignedByDataType && align === undefined;
  const isRightAligned = isByDataType && isRightAlignedDataType(dataType);
  const isCentered = isByDataType && isCenteredDataType(dataType);

  return stylex.props(
    tableBodyCellStyles.base(minWidth, width),
    isRightAligned && tableBodyCellStyles.alignRight,
    isCentered && tableBodyCellStyles.alignCenter,
    pinInfo?.side === 'left' && tableBodyCellStyles.pinnedLeft(pinInfo.offset),
    pinInfo?.side === 'right' &&
      tableBodyCellStyles.pinnedRight(pinInfo.offset),
    pinInfo?.isLastPinnedLeft && tableBodyCellStyles.pinnedShadowLeft,
    pinInfo?.isFirstPinnedRight && tableBodyCellStyles.pinnedShadowRight,
    ...resolveLayoutStyles({ align, isFill, staticWidths }),
    customStylex,
  );
};
