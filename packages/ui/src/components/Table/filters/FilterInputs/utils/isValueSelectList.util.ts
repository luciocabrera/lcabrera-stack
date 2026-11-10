import type { TableColumnDataType } from '#ui/components/Table/Table.types';
import type {
  ColumnFilter,
  OperatorType,
} from '#ui/types/filterOperators.types';

import { shouldShowSelectList } from './shouldShowSelectList.util';

type IsValueSelectListArgs = {
  readonly dataType: TableColumnDataType | undefined;
  readonly filter: ColumnFilter | undefined;
  readonly hasFetchableOptions: boolean;
  readonly operator: OperatorType;
};

const NON_TEXT_DATA_TYPES: ReadonlySet<TableColumnDataType | undefined> =
  new Set(['boolean', 'currency', 'date', 'number']);

export const isValueSelectList = ({
  dataType,
  filter,
  hasFetchableOptions,
  operator,
}: IsValueSelectListArgs) =>
  filter !== undefined &&
  !NON_TEXT_DATA_TYPES.has(dataType) &&
  shouldShowSelectList({ hasFetchableOptions, operator });
