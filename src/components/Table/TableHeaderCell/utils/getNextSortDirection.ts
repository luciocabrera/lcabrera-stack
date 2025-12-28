import type { SortDirection } from '../TableHeaderCell.types';

export const getNextSortDirection = (
  currentDirection: SortDirection,
): SortDirection => {
  // Cycle through: undefined -> asc -> desc -> undefined
  if (currentDirection === undefined) {
    return 'asc';
  }
  if (currentDirection === 'asc') {
    return 'desc';
  }
  return undefined;
};
