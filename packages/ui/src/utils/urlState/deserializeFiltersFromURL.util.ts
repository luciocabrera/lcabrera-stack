import type { ColumnFiltersState } from '#ui/components/Table';

import { filtersCodec } from './filtersCodec.util';

export const deserializeFiltersFromURL = <TData>(param: string) =>
  filtersCodec.deserialize(param) as ColumnFiltersState<TData>;
