import type { SortingState } from '#ui/components/Table';

import { sanitizeSorting } from './sanitizeSorting.util';

type ToKeysetCursorValuesArgs<TData extends Record<string, unknown>> = {
  readonly lastRow?: TData;
  readonly sorting: SortingState<TData>;
};

/**
 * Read the sort-key tuple out of the last loaded row, in `sorting` order — the keyset
 * cursor an endpoint seeks past instead of counting `skip` rows (ADR-052).
 */
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
