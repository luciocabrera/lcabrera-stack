import type { TableColumnDataType } from '#ui/components/Table/Table.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

type ResolveCellNumericStylesArgs = {
  readonly dataType: TableColumnDataType;
  readonly isAlignedByDataType: boolean;
  readonly isNumeric?: boolean;
};

export const NUMERIC_DATA_TYPES: ReadonlySet<TableColumnDataType | undefined> =
  new Set(['currency', 'number']);

export const resolveCellNumericStyles = ({
  dataType,
  isAlignedByDataType,
  isNumeric = false,
}: ResolveCellNumericStylesArgs) =>
  (isNumeric || (isAlignedByDataType && NUMERIC_DATA_TYPES.has(dataType))) &&
  tableBodyCellStyles.tabularFigures;
