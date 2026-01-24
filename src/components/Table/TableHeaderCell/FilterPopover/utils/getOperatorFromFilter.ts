import type { ColumnFilter } from '@/types/filterOperators.types';

/**
 * Get the current operator from a filter
 */
export const getOperatorFromFilter = (
  filter?: ColumnFilter,
): string | undefined => {
  if (!filter) return undefined;
  if (filter.type === 'text') return filter.operator;
  if (filter.type === 'select' || filter.type === 'multiSelect') {
    return filter.operator;
  }
  return undefined;
};
