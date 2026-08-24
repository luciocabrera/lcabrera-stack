import type { ColumnFiltersState } from '#ui/components/Table';

import { filtersCodec } from './filtersCodec.util';

/**
 * `sanitizeFiltersByColumns` checks them against the real columns and drops filters whose
 * type the column cannot carry — but only when the loader passes it `columns`, which is
 * optional on `readTableLoaderStateFromRequest`.
 */
export const deserializeFiltersFromURL = <TData>(param: string) =>
  filtersCodec.deserialize(param) as ColumnFiltersState<TData>;
