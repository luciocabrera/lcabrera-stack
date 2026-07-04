import type { NumberFilter } from '@repo/ui/types/filterOperators.types';

export const computeInitialMaxValue = (
  filter: NumberFilter | undefined,
): '' | number => {
  if (filter?.operator === 'between') {
    return filter.value2 ?? '';
  }
  return '';
};
