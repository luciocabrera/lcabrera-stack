import type { NumberFilter } from '@repo/ui/types/filterOperators.types';

export const computeInitialValue = (filter?: NumberFilter) => {
  return filter?.value ?? '';
};
