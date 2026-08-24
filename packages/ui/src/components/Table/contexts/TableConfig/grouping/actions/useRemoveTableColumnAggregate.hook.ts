import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { useSetTableGrouping } from './useSetTableGrouping.hook';
import { removeTableColumnAggregate } from './utils';

type RemoveTableColumnAggregateArgs = {
  readonly columnKey: string;
  readonly fn?: TableAggregateFn;
};

export const useRemoveTableColumnAggregate = () => {
  const setGrouping = useSetTableGrouping();

  return ({ columnKey, fn }: RemoveTableColumnAggregateArgs) => {
    setGrouping((grouping) =>
      removeTableColumnAggregate({ columnKey, fn, grouping }),
    );
  };
};
