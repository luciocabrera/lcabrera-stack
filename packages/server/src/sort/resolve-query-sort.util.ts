import type { QuerySort } from '../db/query-builder/query-builder.types.ts';
import type { ColumnSort } from './sort.types.ts';

export type ResolveQuerySortArgs = {
  /** Applied when `sorting` is empty. Must itself be non-empty. */
  readonly fallback: readonly ColumnSort[];
  readonly sorting: readonly ColumnSort[];
};

/**
 * Substitutes `fallback` when the request carries no sort. A paginated read with no
 * ORDER BY leaves row order unspecified, so pages silently repeat and skip rows whenever
 * the planner changes its mind — it presents as data corruption and reproduces only under
 * load.
 * @throws When neither `sorting` nor `fallback` yields a sort rule.
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
