import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { useSetTableGrouping } from './useSetTableGrouping.hook';
import { removeTableColumnAggregate } from './utils';

type RemoveTableColumnAggregateArgs = {
  readonly columnKey: string;
  /**
   * The one function to remove, or `undefined` to clear every aggregate on the
   * column.
   */
  readonly fn?: TableAggregateFn;
};

/** Remove one of a column's aggregates, or all of them. */
export const useRemoveTableColumnAggregate = () => {
  const setGrouping = useSetTableGrouping();

  return ({ columnKey, fn }: RemoveTableColumnAggregateArgs) => {
    setGrouping((grouping) =>
      removeTableColumnAggregate({ columnKey, fn, grouping }),
    );
  };
};
