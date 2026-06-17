import type { ColumnFilter } from '@/types/filterOperators.types';

import type { CompactFilterValue } from './serializeFilter.types';

import { getSerializedOperator } from './getSerializedOperator.util';

type SerializeDateFilterArgs = {
  readonly filter: Extract<ColumnFilter, { readonly type: 'date' }>;
};

export const serializeDateFilter = ({
  filter,
}: SerializeDateFilterArgs): CompactFilterValue => {
  const op = getSerializedOperator(filter.operator);

  if (filter.operator === 'between' && filter.value2 !== undefined) {
    return [op, filter.value, filter.value2];
  }

  return [op, filter.value];
};
