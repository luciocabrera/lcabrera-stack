import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

export const isTextFilterValid = (
  filter: Extract<ColumnFilter, { type: 'text' }>,
) => {
  return Boolean(filter.value?.trim());
};
