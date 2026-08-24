import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { removeTableColumnAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

type RemoveColumnAggregateArgs = {
  readonly columnKey: string;
  readonly fn?: TableAggregateFn;
};

export const useRemoveColumnAggregate = () => {
  const setGrouping = useSetGrouping();

  return ({ columnKey, fn }: RemoveColumnAggregateArgs) => {
    setGrouping((grouping) =>
      removeTableColumnAggregate({ columnKey, fn, grouping }),
    );
  };
};
