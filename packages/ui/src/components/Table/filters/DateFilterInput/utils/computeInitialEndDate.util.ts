import type { DateFilter } from '#ui/types/filterOperators.types';

export const computeInitialEndDate = (filter?: DateFilter) => {
  return filter?.operator === 'between' ? (filter.value2 ?? '') : '';
};
