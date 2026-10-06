import type { ColumnFilter } from '#ui/types/filterOperators.types';

export const isSelectFilterValid = (
  filter: Extract<ColumnFilter, { type: 'multiSelect' | 'select' }>,
) => {
  return 'values' in filter && filter.values
    ? filter.values.length > 0
    : Boolean('value' in filter && filter.value);
};
