import type { DateFilter } from '@repo/ui/types/filterOperators.types';

export const computeInitialEndDate = (filter?: DateFilter) => {
  if (filter?.operator === 'between') {
    return filter.value2 ?? '';
  }
  return '';
};
