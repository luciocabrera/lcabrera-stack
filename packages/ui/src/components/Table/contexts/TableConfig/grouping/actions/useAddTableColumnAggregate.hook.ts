import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { useSetTableGrouping } from './useSetTableGrouping.hook';
import { addTableColumnAggregate } from './utils';

type AddTableColumnAggregateArgs = {
  readonly columnKey: string;
  /** The function to apply, beside whatever the column already carries. */
  readonly fn: TableAggregateFn;
};

/**
 * Apply one more aggregate to a column.
 *
 * Whether a given function is *legal* for the column is not decided here: that
 * is the catalogue's answer, shipped on the loader meta (ADR-058, ADR-063), and
 * the menus are built from it so an illegal one is never offered. This action
 * records a selection; the server's `assertGroupAggregates` is the backstop.
 */
export const useAddTableColumnAggregate = () => {
  const setGrouping = useSetTableGrouping();

  return ({ columnKey, fn }: AddTableColumnAggregateArgs) => {
    setGrouping((grouping) =>
      addTableColumnAggregate({ columnKey, fn, grouping }),
    );
  };
};
