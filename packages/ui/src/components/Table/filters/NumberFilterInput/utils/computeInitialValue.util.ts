import type { NumberFilter } from '@lcabrera/ui/types/filterOperators.types';

export const computeInitialValue = (filter?: NumberFilter) => {
  return filter?.value ?? '';
};
