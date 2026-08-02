import type { SortingState } from '@lcabrera/ui/components/Table';

import { sanitizeSorting } from './sanitizeSorting.util';

type ToKeysetCursorValuesArgs<TData extends Record<string, unknown>> = {
  readonly lastRow?: TData;
  readonly sorting: SortingState<TData>;
};

/**
 * Read the sort-key tuple out of the last loaded row, in `sorting` order — the
 * keyset cursor an endpoint seeks past instead of counting `skip` rows
 * (ADR-052). Returns `undefined` with no `lastRow`, which is the first page and
 * the signal to fall back to offset paging.
 *
 * The tuple is only a valid cursor if it matches the order the server sorts by,
 * so entries the sort does not actually use — the UI-only `actions` column, and
 * any column with no direction — are dropped by `sanitizeSorting` rather than
 * contributing a value the server would compare against the wrong column.
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
