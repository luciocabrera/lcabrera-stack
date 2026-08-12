import type { ColumnFilter } from '#ui/types/filterOperators.types';

type SerializeBooleanFilterArgs = {
  readonly filter: Extract<ColumnFilter, { readonly type: 'boolean' }>;
};

export const serializeBooleanFilter = ({
  filter,
}: SerializeBooleanFilterArgs) => filter.value;
