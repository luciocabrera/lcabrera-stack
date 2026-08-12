import type { DateFilter } from '#ui/types/filterOperators.types';

export const computeInitialValue = (filter?: DateFilter) => {
  if (filter?.operator === 'between') {
    return filter.value;
  }
  return filter?.value ?? '';
};
