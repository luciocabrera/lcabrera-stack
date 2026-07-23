import type { QuerySort } from '@lcabrera/server/db/query-builder/query-builder.types';

import type { SortRule } from '../types/api.types.js';

import { HttpError } from '../errors/httpError.js';

type ResolveSortRulesArgs = {
  readonly fallbackSorting: readonly SortRule[];
  readonly sorting: readonly SortRule[];
};

/**
 * Adapt the demo API's `SortRule` (`columnKey`) shape to `@lcabrera/server`'s
 * `QuerySort` (`column`) for `selectRows`, applying the fallback when the
 * request carries no sort. `selectRows`/`buildSelectQuery` validates each
 * column against `allowedColumns` and builds the ORDER BY, so this only adapts
 * the shape and guarantees a non-empty sort — a paginated read with no ORDER BY
 * returns rows in an unspecified order, so pages can repeat or skip rows.
 *
 * @throws When neither the request nor the fallback yields a sort rule.
 */
export const resolveSortRules = ({
  fallbackSorting,
  sorting,
}: ResolveSortRulesArgs): readonly QuerySort[] => {
  const activeSorting = sorting.length > 0 ? sorting : fallbackSorting;

  if (activeSorting.length === 0) {
    throw new HttpError({
      message: 'A fallback sorting strategy is required.',
      statusCode: 500,
    });
  }

  return activeSorting.map(({ columnKey, direction }) => ({
    column: columnKey,
    direction,
  }));
};
