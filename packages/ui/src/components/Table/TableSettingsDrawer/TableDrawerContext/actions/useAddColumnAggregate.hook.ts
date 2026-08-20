import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { addTableColumnAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

type AddColumnAggregateArgs = {
  readonly columnKey: string;
  /** The function to stage, beside whatever the column already carries. */
  readonly fn: TableAggregateFn;
};

/** Stage one more aggregate for a column. */
export const useAddColumnAggregate = () => {
  const setGrouping = useSetGrouping();

  return ({ columnKey, fn }: AddColumnAggregateArgs) => {
    setGrouping((grouping) =>
      addTableColumnAggregate({ columnKey, fn, grouping }),
    );
  };
};
