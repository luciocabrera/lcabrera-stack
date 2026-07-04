import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

import type { CompactFilterValue } from './serializeFilter.types';

type SerializeSelectFilterArgs = {
  readonly filter: Extract<
    ColumnFilter,
    { readonly type: 'multiSelect' | 'select' }
  >;
};

export const serializeSelectFilter = ({
  filter,
}: SerializeSelectFilterArgs): CompactFilterValue => {
  const values = filter.values ?? (filter.value ? [filter.value] : []);

  if (filter.operator === 'notEquals') {
    return ['!', ...values];
  }

  return values;
};
