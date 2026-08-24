import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';
import { useDataStore } from '#ui/components/Table/contexts/TableData/data/useDataStore.hook';
import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

import { getShareDenominators } from './getShareDenominators.util';

type GetTableShareDenominatorArgs = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};

/**
 * **It returns a number, and that is load-bearing.** `useSyncExternalStore` compares
 * snapshots with `Object.is`, so a selector handing back a freshly built map would
 * re-render forever.
 * The fold that produces the map happens in `getShareDenominators`, which caches on the
 * stored rows array, and only the one primitive this cell needs crosses the snapshot
 * boundary.
 */
export const useGetTableShareDenominator = ({
  columnKey,
  fn,
}: GetTableShareDenominatorArgs) => {
  const shares = useGroupingStore((state) => state.shares);

  return useDataStore<number | undefined, Record<string, unknown>>((state) =>
    getShareDenominators({ rows: state.data, shares }).get(
      toTableAggregateToken({ columnKey, fn }),
    ),
  );
};
