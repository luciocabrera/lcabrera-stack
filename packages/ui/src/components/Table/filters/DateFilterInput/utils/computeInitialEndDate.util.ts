import type { DateFilter } from '#ui/types/filterOperators.types';

export const computeInitialEndDate = (filter?: DateFilter) => {
  if (filter?.operator === 'between') {
    return filter.value2 ?? '';
  }
  return '';
};
