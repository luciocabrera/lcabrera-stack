import type { SortingState } from '#ui/components/Table';

import { sanitizeSorting } from './sanitizeSorting.util';

type ToQuerySortArgs<TData extends Record<string, unknown>> = {
  readonly sorting: SortingState<TData>;
};

export const toQuerySort = <TData extends Record<string, unknown>>({
  sorting,
}: ToQuerySortArgs<TData>) =>
  sanitizeSorting<TData>(sorting).map(({ columnKey, direction }) => ({
    column: columnKey,
    direction,
  }));
