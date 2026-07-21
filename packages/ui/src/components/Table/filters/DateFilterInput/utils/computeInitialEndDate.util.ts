import type { DateFilter } from '@lcabrera/ui/types/filterOperators.types';

export const computeInitialEndDate = (filter?: DateFilter) => {
  if (filter?.operator === 'between') {
    return filter.value2 ?? '';
  }
  return '';
};
