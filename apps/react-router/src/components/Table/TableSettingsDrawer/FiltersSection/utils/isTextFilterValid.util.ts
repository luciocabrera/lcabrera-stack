import type { ColumnFilter } from '@/types/filterOperators.types';

export const isTextFilterValid = (
  filter: Extract<ColumnFilter, { type: 'text' }>,
) => {
  return Boolean(filter.value?.trim());
};
