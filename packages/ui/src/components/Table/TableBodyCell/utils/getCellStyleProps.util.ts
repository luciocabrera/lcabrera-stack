import * as stylex from '@stylexjs/stylex';

import type {
  TableColumnAlign,
  TableColumnDataType,
} from '#ui/components/Table/Table.types';
import type { TableStaticColumnWidths } from '#ui/components/Table/utils/resolveStaticColumnWidths.util';

import type { TableBodyCellProps } from '../TableBodyCell.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';
import { resolveCellDataTypeAlignStyles } from './resolveCellDataTypeAlignStyles.util';
import { resolveCellLayoutStyles } from './resolveCellLayoutStyles.util';
import { resolveCellPinStyles } from './resolveCellPinStyles.util';

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
}: GetCellStylePropsArgs) =>
  stylex.props(
    tableBodyCellStyles.base(minWidth, width),
    ...resolveCellDataTypeAlignStyles({ align, dataType, isAlignedByDataType }),
    ...resolveCellPinStyles(pinInfo),
    ...resolveCellLayoutStyles({ align, isFill, staticWidths }),
    customStylex,
  );
