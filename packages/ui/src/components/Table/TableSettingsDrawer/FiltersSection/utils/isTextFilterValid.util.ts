import type { ColumnFilter } from '#ui/types/filterOperators.types';

export const isTextFilterValid = (
  filter: Extract<ColumnFilter, { type: 'text' }>,
) => {
  return Boolean(filter.value?.trim());
};
