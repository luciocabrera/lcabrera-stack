import type { ColumnFiltersState } from '#ui/components/Table';

import { filtersCodec } from './filtersCodec.util';

/**
 * Deserialize a compact filters URL param back to ColumnFiltersState.
 *
 * Infers filter types from value shapes and expands short operator codes. A
 * param that is not a `{ columnKey: filter }` object is refused whole; within
 * one that is, an unrecognised filter value yields no filter for that column.
 * The column keys stay bare strings — `sanitizeFiltersByColumns` checks them
 * against the real columns downstream.
 */
export const deserializeFiltersFromURL = <TData>(param: string) =>
  filtersCodec.deserialize(param) as ColumnFiltersState<TData>;
