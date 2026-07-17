import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

/**
 * The text a drafted filter carries into a text filter: a text filter's own
 * value, or a select filter's chosen option. Every other filter type holds no
 * text to carry, so the draft starts empty.
 */
export const getDraftedText = (filter?: ColumnFilter) => {
  if (filter?.type === 'text') {
    return filter.value;
  }

  if (filter?.type === 'multiSelect' || filter?.type === 'select') {
    return filter.value ?? filter.values?.[0] ?? '';
  }

  return '';
};
