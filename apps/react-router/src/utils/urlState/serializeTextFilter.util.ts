import type { ColumnFilter } from '@/types/filterOperators.types';

import type { CompactFilterValue } from './serializeFilter.types';
import { getSerializedOperator } from './getSerializedOperator.util';

type SerializeTextFilterArgs = {
  readonly filter: Extract<ColumnFilter, { readonly type: 'text' }>;
};

export const serializeTextFilter = ({
  filter,
}: SerializeTextFilterArgs): CompactFilterValue => {
  const op = getSerializedOperator(filter.operator);

  return [op, filter.value];
};
