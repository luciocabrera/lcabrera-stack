import type { NumberFilter } from '@/types/filterOperators.types';

export const computeInitialValue = (filter?: NumberFilter) => {
  return filter?.value ?? '';
};
