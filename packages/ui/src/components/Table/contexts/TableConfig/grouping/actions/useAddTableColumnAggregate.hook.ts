import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { useSetTableGrouping } from './useSetTableGrouping.hook';
import { addTableColumnAggregate } from './utils';

type AddTableColumnAggregateArgs = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};

/**
 * Whether a given function is *legal* for the column is not decided here: that is the
 * catalogue's answer, shipped on the loader meta (ADR-058, ADR-063), and the menus are
 * built from it so an illegal one is never offered.
 */
export const useAddTableColumnAggregate = () => {
  const setGrouping = useSetTableGrouping();

  return ({ columnKey, fn }: AddTableColumnAggregateArgs) => {
    setGrouping((grouping) =>
      addTableColumnAggregate({ columnKey, fn, grouping }),
    );
  };
};
