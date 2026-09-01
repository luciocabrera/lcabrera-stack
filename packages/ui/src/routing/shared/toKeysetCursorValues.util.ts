import type { SortingState } from '#ui/components/Table';

import { sanitizeSorting } from './sanitizeSorting.util';

type ToKeysetCursorValuesArgs<TData extends Record<string, unknown>> = {
  readonly lastRow?: TData;
  readonly sorting: SortingState<TData>;
};

export const toKeysetCursorValues = <TData extends Record<string, unknown>>({
  lastRow,
  sorting,
}: ToKeysetCursorValuesArgs<TData>) => {
  if (lastRow === undefined) {
    return;
  }

  return sanitizeSorting<TData>(sorting).map(
    ({ columnKey }) => lastRow[columnKey],
  );
};
