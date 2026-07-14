import type { TableColumnsState } from '@repo/ui/components/Table/Table.types';

import { areEqualByJson } from '@repo/ui/utils/comparison';

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
