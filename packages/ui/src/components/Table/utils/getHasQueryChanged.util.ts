import { areEqualByJson } from '@lcabrera/utils/comparison/are-equal-by-json.util';

import type { TableColumnsState } from '#ui/components/Table/Table.types';

type GetHasQueryChangedArgs<TData> = {
  readonly columnsState?: Partial<TableColumnsState<TData>>;
  readonly nextColumnFilters: TableColumnsState<TData>['columnFilters'];
  readonly nextSorting: TableColumnsState<TData>['sorting'];
};

export const getHasQueryChanged = <TData>({
  columnsState,
  nextColumnFilters,
  nextSorting,
}: GetHasQueryChangedArgs<TData>) => {
  const hasSortingChanged = !areEqualByJson({
    left: columnsState?.sorting,
    right: nextSorting,
  });
  const hasFiltersChanged = !areEqualByJson({
    left: columnsState?.columnFilters,
    right: nextColumnFilters,
  });

  return hasSortingChanged || hasFiltersChanged;
};
