import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { useSetTableGrouping } from './useSetTableGrouping.hook';
import { addTableColumnAggregate } from './utils';

type AddTableColumnAggregateArgs = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};

export const useAddTableColumnAggregate = () => {
  const setGrouping = useSetTableGrouping();

  return ({ columnKey, fn }: AddTableColumnAggregateArgs) => {
    setGrouping((grouping) =>
      addTableColumnAggregate({ columnKey, fn, grouping }),
    );
  };
};
