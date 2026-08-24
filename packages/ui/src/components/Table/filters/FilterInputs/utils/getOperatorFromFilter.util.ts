import type { TableColumnDataType } from '#ui/components/Table/Table.types';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

export type GetOperatorFromFilterParams = {
  readonly dataType?: TableColumnDataType;
  readonly filter: ColumnFilter | undefined;
};

export const getOperatorFromFilter = ({
  dataType,
  filter,
}: GetOperatorFromFilterParams) => {
  if (!filter) return 'equals';
  if (dataType === 'boolean') return 'equals';
  if ('operator' in filter && filter.operator) {
    return filter.operator;
  }
  return 'equals';
};
