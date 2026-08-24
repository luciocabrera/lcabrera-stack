import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { useGroupingStore } from '#ui/components/Table/contexts/TableConfig/grouping/useGroupingStore.hook';

type GetTableColumnShareArgs = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};

export const useGetTableColumnShare = ({
  columnKey,
  fn,
}: GetTableColumnShareArgs) =>
  useGroupingStore((state) =>
    state.shares.some(
      (share) => share.columnKey === columnKey && share.fn === fn,
    ),
  );
