import type { NumberFilter } from '@/types/filterOperators.types';

export const computeInitialValue = (
  filter: NumberFilter | undefined,
): '' | number => {
  if (filter?.operator === 'between') {
    return filter.value;
  }
  return filter?.value ?? '';
};
