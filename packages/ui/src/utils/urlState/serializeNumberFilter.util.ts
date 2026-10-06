import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { getSerializedOperator } from './getSerializedOperator.util';

type SerializeNumberFilterArgs = {
  readonly filter: Extract<ColumnFilter, { readonly type: 'number' }>;
};

export const serializeNumberFilter = ({
  filter,
}: SerializeNumberFilterArgs) => {
  const op = getSerializedOperator(filter.operator);

  return filter.operator === 'between' && filter.value2 !== undefined
    ? [op, filter.value, filter.value2]
    : [op, filter.value];
};
