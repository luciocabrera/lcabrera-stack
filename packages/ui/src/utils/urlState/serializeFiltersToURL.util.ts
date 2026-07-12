import type { ColumnFiltersState } from '@repo/ui/components/Table';

import { serializeFilter } from './serializeFilter.util';

/**
 * Serialize ColumnFiltersState to a compact URL-friendly string.
 *
 * Removes redundant `type` keys and uses short operator codes.
 * Returns undefined when there are no filters.
 */
export const serializeFiltersToURL = (filters: ColumnFiltersState) => {
  const entries = Object.entries(filters);
  if (entries.length === 0) return undefined;

  const compact = Object.fromEntries(
    entries.map(([columnKey, filter]) => [
      columnKey,
      serializeFilter({ filter }),
    ]),
  );

  return JSON.stringify(compact);
};
