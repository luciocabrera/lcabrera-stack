import type {
  TableColumnAlign,
  TableColumnDataType,
} from '#ui/components/Table/Table.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';
import { NUMERIC_DATA_TYPES } from './resolveCellNumericStyles.util';

type ResolveCellDataTypeAlignStylesArgs = {
  readonly align?: TableColumnAlign;
  readonly dataType: TableColumnDataType;
  readonly isAlignedByDataType: boolean;
};

const CENTERED_DATA_TYPES: ReadonlySet<TableColumnDataType> = new Set([
  'boolean',
  'date',
]);

export const resolveCellDataTypeAlignStyles = ({
  align,
  dataType,
  isAlignedByDataType,
}: ResolveCellDataTypeAlignStylesArgs) => {
  const isByDataType = isAlignedByDataType && align === undefined;

  return [
    isByDataType &&
      NUMERIC_DATA_TYPES.has(dataType) &&
      tableBodyCellStyles.alignRight,
    isByDataType &&
      CENTERED_DATA_TYPES.has(dataType) &&
      tableBodyCellStyles.alignCenter,
  ];
};
