import type { SortRule } from '../types/api.types.js';

import { HttpError } from '../errors/httpError.js';

type BuildOrderByClauseArgs = {
  readonly fallbackSorting: readonly SortRule[];
  readonly sorting: readonly SortRule[];
};

/**
 * Build a safe ORDER BY clause from validated sort rules.
 */
export const buildOrderByClause = ({
  fallbackSorting,
  sorting,
}: BuildOrderByClauseArgs): string => {
  const activeSorting = sorting.length > 0 ? sorting : fallbackSorting;

  if (activeSorting.length === 0) {
    throw new HttpError({
      message: 'A fallback sorting strategy is required.',
      statusCode: 500,
    });
  }

  return `ORDER BY ${activeSorting
    .map(
      ({ columnKey, direction }) =>
        `${columnKey} ${direction === 'desc' ? 'DESC' : 'ASC'}`,
    )
    .join(', ')}`;
};
