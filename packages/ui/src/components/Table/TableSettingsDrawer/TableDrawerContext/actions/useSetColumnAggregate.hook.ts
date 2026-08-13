import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { setTableColumnAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

type SetColumnAggregateArgs = {
  readonly columnKey: string;
  /** The function to stage, or `undefined` to clear this column's aggregate. */
  readonly fn: TableAggregateFn | undefined;
};

/** Stage an aggregate for a column, or clear the one staged. */
export const useSetColumnAggregate = () => {
  const setGrouping = useSetGrouping();

  return ({ columnKey, fn }: SetColumnAggregateArgs) => {
    setGrouping((grouping) =>
      setTableColumnAggregate({ columnKey, fn, grouping }),
    );
  };
};
