import type { QuerySort } from '../db/query-builder/query-builder.types.ts';
import type { ColumnSort } from './sort.types.ts';

export type ResolveQuerySortArgs = {
  /** Applied when `sorting` is empty. Must itself be non-empty. */
  readonly fallback: readonly ColumnSort[];
  /** The sort the request asked for; empty when it asked for none. */
  readonly sorting: readonly ColumnSort[];
};

/**
 * Translate a request's sorting state (`columnKey`) into the `QuerySort`
 * (`column`) list the select builders consume, substituting `fallback` when the
 * request carries no sort.
 *
 * The guarantee worth having is the **non-empty result**. A paginated read with
 * no ORDER BY leaves row order unspecified, so pages silently repeat and skip
 * rows whenever the planner changes its mind between requests — it presents as
 * data corruption and reproduces only under load. Refusing an empty sort here
 * turns that into an immediate, named failure at the one place that can see
 * both the request's sort and the endpoint's default.
 *
 * Shape and non-emptiness only: `buildSelectQuery` already validates every
 * column against `allowedColumns` and quotes it, so this deliberately does not
 * re-check either.
 *
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
