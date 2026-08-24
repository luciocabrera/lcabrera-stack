import type { ColumnFiltersState } from '#ui/components/Table';

import { filtersCodec } from './filtersCodec.util';

export const serializeFiltersToURL = (filters: ColumnFiltersState) => {
  if (Object.keys(filters).length === 0) return;

  return filtersCodec.serialize(filters);
};
