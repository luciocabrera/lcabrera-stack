import type { QuerySort } from '../db/query-builder/query-builder.types.ts';
import type { ColumnSort } from './sort.types.ts';

export type ResolveQuerySortArgs = {
  readonly fallback: readonly ColumnSort[];
  readonly sorting: readonly ColumnSort[];
};

/**
 * A paginated read with no ORDER BY leaves row order unspecified, so pages silently repeat
 * and skip rows whenever the planner changes its mind between requests — it presents as
 * data corruption and reproduces only under load.
 * Shape and non-emptiness only: `buildSelectQuery` already validates every column against
 * `allowedColumns` and quotes it, so this deliberately does not re-check either.
 */
export const resolveQuerySort = ({
  fallback,
  sorting,
}: ResolveQuerySortArgs): readonly QuerySort[] => {
  const active = sorting.length > 0 ? sorting : fallback;

  if (active.length === 0) {
    throw new Error(
      'A non-empty `fallback` sort is required: a paginated read with no ORDER BY returns rows in an unspecified order.',
    );
  }

  return active.map(({ columnKey, direction }) => ({
    column: columnKey,
    direction,
  }));
};
