import type { QuerySort } from '../db/query-builder/query-builder.types.ts';
import type { ColumnSort } from './sort.types.ts';

export type ResolveQuerySortArgs = {
  readonly fallback: readonly ColumnSort[];
  readonly sorting: readonly ColumnSort[];
};

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
