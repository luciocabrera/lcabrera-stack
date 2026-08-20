import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { removeTableColumnAggregate } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

type RemoveColumnAggregateArgs = {
  readonly columnKey: string;
  /**
   * The one function to un-stage, or `undefined` to clear every aggregate
   * staged on the column.
   */
  readonly fn?: TableAggregateFn;
};

/** Un-stage one of a column's aggregates, or all of them. */
export const useRemoveColumnAggregate = () => {
  const setGrouping = useSetGrouping();

  return ({ columnKey, fn }: RemoveColumnAggregateArgs) => {
    setGrouping((grouping) =>
      removeTableColumnAggregate({ columnKey, fn, grouping }),
    );
  };
};
