import type { QuerySort } from '@repo/server/db/query-builder/query-builder.types';
import type { SortingState } from '@repo/ui/components/Table';

import type { EnterpriseOrder } from './enterpriseOrders.types';

export type ToOrderQuerySortArgs = {
  readonly sorting: SortingState<EnterpriseOrder>;
};

/**
 * Translate the table `SortingState` to the generic `QuerySort[]`. The
 * synthetic `actions` column is skipped, and a missing direction defaults to
 * ascending.
 */
export const toOrderQuerySort = ({
  sorting,
}: ToOrderQuerySortArgs): readonly QuerySort[] =>
  sorting
    .filter((entry) => entry.columnKey !== 'actions')
    .map((entry) => ({
      column: entry.columnKey,
      direction: entry.direction ?? 'asc',
    }));
