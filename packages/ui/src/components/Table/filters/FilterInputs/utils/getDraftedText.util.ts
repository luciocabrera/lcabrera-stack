import type { ColumnFilter } from '#ui/types/filterOperators.types';

export const getDraftedText = (filter?: ColumnFilter) => {
  if (filter?.type === 'text') {
    return filter.value;
  }

  if (filter?.type === 'multiSelect' || filter?.type === 'select') {
    return filter.value ?? filter.values?.[0] ?? '';
  }

  return '';
};
