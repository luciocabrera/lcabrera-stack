import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';

type GetTableColumnShareArgs = {
  readonly columnKey: string;
  /** Which of the column's aggregates is being asked about (#831). */
  readonly fn: TableAggregateFn;
};

/**
 * Whether this aggregate renders as a share of the grand total.
 *
 * It asks about a `(columnKey, fn)` pair rather than a column, because a column
 * may carry both `sum` and `count` and each takes its own share.
 */
export const useGetTableColumnShare = ({
  columnKey,
  fn,
}: GetTableColumnShareArgs) =>
  useGroupingStore((state) =>
    state.shares.some(
      (share) => share.columnKey === columnKey && share.fn === fn,
    ),
  );
