import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

export const isSelectFilterValid = (
  filter: Extract<ColumnFilter, { type: 'multiSelect' | 'select' }>,
) => {
  if ('values' in filter && filter.values) {
    return filter.values.length > 0;
  }
  return Boolean('value' in filter && filter.value);
};
