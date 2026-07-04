import type { DateFilter } from '@repo/ui/types/filterOperators.types';

export const computeInitialValue = (filter?: DateFilter) => {
  if (filter?.operator === 'between') {
    return filter.value;
  }
  return filter?.value ?? '';
};
