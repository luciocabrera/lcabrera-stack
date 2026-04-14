import type { DateFilter } from '@/types/filterOperators.types';

export const computeInitialValue = (filter?: DateFilter) => {
  if (filter?.operator === 'between') {
    return filter.value;
  }
  return filter?.value ?? '';
};
