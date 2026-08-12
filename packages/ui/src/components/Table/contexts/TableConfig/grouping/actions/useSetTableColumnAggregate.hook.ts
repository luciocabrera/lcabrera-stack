import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { useSetTableGrouping } from './useSetTableGrouping.hook';
import { setTableColumnAggregate } from './utils';

type SetTableColumnAggregateArgs = {
  readonly columnKey: string;
  /** The function to apply, or `undefined` to clear this column's aggregate. */
  readonly fn: TableAggregateFn | undefined;
};

/**
 * Apply an aggregate to a column, or clear the one applied.
 *
 * Whether a given function is *legal* for the column is not decided here: that
 * is the catalogue's answer, shipped on the loader meta (ADR-058, ADR-063), and
 * the menus are built from it so an illegal one is never offered. This action
 * records a selection; the server's `assertGroupAggregates` is the backstop.
 */
export const useSetTableColumnAggregate = () => {
  const setGrouping = useSetTableGrouping();

  return ({ columnKey, fn }: SetTableColumnAggregateArgs) => {
    setGrouping((grouping) =>
      setTableColumnAggregate({ columnKey, fn, grouping }),
    );
  };
};
