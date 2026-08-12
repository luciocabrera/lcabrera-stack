import type { ColumnFiltersState } from '#ui/components/Table';

import { filtersCodec } from './filtersCodec.util';

/**
 * Serialize ColumnFiltersState to a compact URL-friendly string.
 *
 * Removes redundant `type` keys and uses short operator codes.
 * Returns undefined when there are no filters.
 */
export const serializeFiltersToURL = (filters: ColumnFiltersState) => {
  if (Object.keys(filters).length === 0) return;

  return filtersCodec.serialize(filters);
};
