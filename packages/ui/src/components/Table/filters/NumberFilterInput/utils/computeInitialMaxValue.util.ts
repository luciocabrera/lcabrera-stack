import type { NumberFilter } from '#ui/types/filterOperators.types';

export const computeInitialMaxValue = (
  filter: NumberFilter | undefined,
): '' | number => {
  return filter?.operator === 'between' ? (filter.value2 ?? '') : '';
};
