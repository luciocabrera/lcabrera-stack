import type { SortDirection } from '@/components/Table/Table.types';

export const getNextSortDirection = (
  currentDirection: SortDirection | undefined,
): SortDirection | undefined => {
  // Cycle through: undefined -> asc -> desc -> undefined
  if (currentDirection === undefined) return 'asc';

  if (currentDirection === 'asc') return 'desc';

  return undefined;
};
