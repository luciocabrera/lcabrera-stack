import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { toggleGroupShare } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';

import { useSetGrouping } from './useSetGrouping.hook';

type ToggleGroupShareArgs = {
  readonly columnKey: string;
  /** Which of the column's aggregates the share belongs to (#831). */
  readonly fn: TableAggregateFn;
};

/**
 * Stage one aggregate's share of the grand total on or off. The drawer's twin of
 * the grouping reducers beside it, resolving through the same shared util so
 * what is staged is exactly what Accept commits.
 */
export const useToggleGroupShare = () => {
  const setGrouping = useSetGrouping();

  return ({ columnKey, fn }: ToggleGroupShareArgs) => {
    setGrouping((grouping) => toggleGroupShare({ columnKey, fn, grouping }));
  };
};
