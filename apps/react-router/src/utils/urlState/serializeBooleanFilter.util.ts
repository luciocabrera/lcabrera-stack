import type { ColumnFilter } from '@/types/filterOperators.types';

import type { CompactFilterValue } from './serializeFilter.types';

type SerializeBooleanFilterArgs = {
  readonly filter: Extract<ColumnFilter, { readonly type: 'boolean' }>;
};

export const serializeBooleanFilter = ({
  filter,
}: SerializeBooleanFilterArgs): CompactFilterValue => filter.value;
