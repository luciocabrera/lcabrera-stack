import type { ColumnFilter } from '#ui/types/filterOperators.types';

export const getDraftedText = (filter?: ColumnFilter) => {
  if (filter?.type === 'text') {
    return filter.value;
  }

  return filter?.type === 'multiSelect' || filter?.type === 'select'
    ? (filter.value ?? filter.values?.[0] ?? '')
    : '';
};
