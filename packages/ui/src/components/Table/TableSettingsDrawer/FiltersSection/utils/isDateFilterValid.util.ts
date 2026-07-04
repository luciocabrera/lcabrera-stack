import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

export const isDateFilterValid = (
  filter: Extract<ColumnFilter, { type: 'date' }>,
) => {
  if (!filter.value) return false;
  if (filter.operator === 'between') {
    return Boolean(filter.value2);
  }
  return true;
};
