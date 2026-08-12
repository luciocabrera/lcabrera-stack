import type { NumberFilter } from '#ui/types/filterOperators.types';

export const computeInitialValue = (filter?: NumberFilter) => {
  return filter?.value ?? '';
};
