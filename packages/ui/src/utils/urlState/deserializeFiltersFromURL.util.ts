import type { ColumnFiltersState } from '#ui/components/Table';

import { filtersCodec } from './filtersCodec.util';

/**
 * Deserialize a compact filters URL param back to ColumnFiltersState.
 *
 * Infers filter types from value shapes and expands short operator codes. A
 * param that is not a `{ columnKey: filter }` object is refused whole; within
 * one that is, a value no filter shape matches yields no filter for that
 * column. Note that an unknown *operator code* is not such a value — see
 * `filtersCodec` for what that per-entry drop does and does not cover.
 *
 * The column keys stay bare strings. `sanitizeFiltersByColumns` checks them
 * against the real columns and drops filters whose type the column cannot
 * carry — but only when the loader passes it `columns`, which is optional on
 * `readTableLoaderStateFromRequest`. A loader that omits them gets these
 * filters unchecked.
 */
export const deserializeFiltersFromURL = <TData>(param: string) =>
  filtersCodec.deserialize(param) as ColumnFiltersState<TData>;
