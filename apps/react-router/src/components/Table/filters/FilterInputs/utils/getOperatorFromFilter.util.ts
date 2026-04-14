import type { TableColumnDataType } from '@/components/Table/Table.types';
import type { ColumnFilter, OperatorType } from '@/types/filterOperators.types';

export type GetOperatorFromFilterParams = {
  readonly dataType?: TableColumnDataType;
  readonly filter: ColumnFilter | undefined;
};

/**
 * Gets the operator from an existing filter or defaults to 'equals'.
 */
export const getOperatorFromFilter = ({
  dataType,
  filter,
}: GetOperatorFromFilterParams): OperatorType => {
  if (!filter) return 'equals';
  if (dataType === 'boolean') return 'equals';
  if ('operator' in filter && filter.operator) {
    return filter.operator;
  }
  return 'equals';
};
