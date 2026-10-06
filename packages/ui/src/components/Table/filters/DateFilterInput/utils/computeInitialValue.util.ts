import type { DateFilter } from '#ui/types/filterOperators.types';

export const computeInitialValue = (filter?: DateFilter) => {
  return filter?.operator === 'between' ? filter.value : (filter?.value ?? '');
};
