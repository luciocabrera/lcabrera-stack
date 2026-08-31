import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';
import { useDataStore } from '#ui/components/Table/contexts/TableData/data/useDataStore.hook';
import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

import { getShareDenominators } from './getShareDenominators.util';

type GetTableShareDenominatorArgs = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};

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
