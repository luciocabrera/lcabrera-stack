import type {
  TableColumnAlign,
  TableColumnDataType,
} from '#ui/components/Table/Table.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

type ResolveCellDataTypeAlignStylesArgs = {
  readonly align?: TableColumnAlign;
  readonly dataType: TableColumnDataType;
  readonly isAlignedByDataType: boolean;
};

const isRightAlignedDataType = (dataType: TableColumnDataType) =>
  dataType === 'number' || dataType === 'currency';

const isCenteredDataType = (dataType: TableColumnDataType) =>
  dataType === 'boolean' || dataType === 'date';

export const resolveCellDataTypeAlignStyles = ({
  align,
  dataType,
  isAlignedByDataType,
}: ResolveCellDataTypeAlignStylesArgs) => {
  const isByDataType = isAlignedByDataType && align === undefined;

  return [
    isByDataType &&
      isRightAlignedDataType(dataType) &&
      tableBodyCellStyles.alignRight,
    isByDataType &&
      isCenteredDataType(dataType) &&
      tableBodyCellStyles.alignCenter,
  ];
};
