import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

export const isNumberFilterValid = (
  filter: Extract<ColumnFilter, { type: 'number' }>,
) => {
  const { operator, value, value2 } = filter;

  if (typeof value !== 'number' || Number.isNaN(value)) {
    return false;
  }

  if (operator === 'between') {
    return (
      typeof value2 === 'number' && !Number.isNaN(value2) && value2 > value
    );
  }

  return true;
};
