import type { ColumnFilter } from '#ui/types/filterOperators.types';

export const isDateFilterValid = (
  filter: Extract<ColumnFilter, { type: 'date' }>,
) =>
  Boolean(filter.value) &&
  (filter.operator !== 'between' || Boolean(filter.value2));
