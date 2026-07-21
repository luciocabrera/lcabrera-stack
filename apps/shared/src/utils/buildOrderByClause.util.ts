import { buildOrderByClause as buildSafeOrderByClause } from '@repo/data-access/db/queryBuilder/buildOrderByClause.util';

import type { SortRule } from '../types/api.types.js';

import { HttpError } from '../errors/httpError.js';

type BuildOrderByClauseArgs = {
  /**
   * Columns the caller permits sorting by. Required rather than optional:
   * every caller here sorts by a column that originated in a query string,
   * and `assertColumnAllowed` is a no-op when this is omitted.
   */
  readonly allowedColumns: ReadonlySet<string> | readonly string[];
  readonly fallbackSorting: readonly SortRule[];
  readonly sorting: readonly SortRule[];
};

/**
 * Build a safe ORDER BY clause from validated sort rules.
 *
 * This is an adapter, not an implementation: the SQL is built by
 * `@repo/data-access`, which validates each identifier's shape, checks it
 * against the allow-list, and quotes it. All this adds is the demo API's
 * own `SortRule` shape (`columnKey`) and its fallback-sorting rule, so the
 * two servers keep one clause builder between them instead of a second
 * hand-rolled one.
 *
 * @throws When no sort rule survives — a paginated query with no ORDER BY
 * returns rows in an unspecified order, so pages can repeat or skip rows.
 */
export const buildOrderByClause = ({
  allowedColumns,
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

  return buildSafeOrderByClause({
    allowedColumns: [...allowedColumns],
    sort: activeSorting.map(({ columnKey, direction }) => ({
      column: columnKey,
      direction,
    })),
  });
};
