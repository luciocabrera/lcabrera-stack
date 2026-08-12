import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { getSerializedOperator } from './getSerializedOperator.util';

type SerializeTextFilterArgs = {
  readonly filter: Extract<ColumnFilter, { readonly type: 'text' }>;
};

export const serializeTextFilter = ({ filter }: SerializeTextFilterArgs) => {
  const op = getSerializedOperator(filter.operator);

  return [op, filter.value];
};
