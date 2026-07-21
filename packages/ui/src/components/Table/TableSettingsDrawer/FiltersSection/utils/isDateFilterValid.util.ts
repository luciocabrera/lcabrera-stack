import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

export const isDateFilterValid = (
  filter: Extract<ColumnFilter, { type: 'date' }>,
) => {
  if (!filter.value) return false;
  if (filter.operator === 'between') {
    return Boolean(filter.value2);
  }
  return true;
};
