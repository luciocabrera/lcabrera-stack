import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { getSerializedOperator } from './getSerializedOperator.util';

type SerializeEmptyFilterArgs = {
  readonly filter: Extract<ColumnFilter, { readonly type: 'empty' }>;
};

export const serializeEmptyFilter = ({ filter }: SerializeEmptyFilterArgs) => ({
  op: getSerializedOperator(filter.operator),
});
