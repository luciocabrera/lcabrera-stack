import type { SortingState } from '@lcabrera/ui/components/Table';

import { logger } from '@lcabrera/ui/utils/logger';

type CompactSorting = Record<string, 'asc' | 'desc'>;

/**
 * Deserialize a compact sorting URL param back to SortingState.
 *
 * Converts `{"name":"asc"}` back to `[{ columnKey: "name", direction: "asc" }]`.
 * Preserves insertion order from the object.
 */
export const deserializeSortingFromURL = <TData>(param: string) => {
  try {
    const parsed = JSON.parse(param) as CompactSorting;

    return Object.entries(parsed).map(([columnKey, direction]) => ({
      columnKey: columnKey as SortingState<TData>[number]['columnKey'],
      direction,
    }));
  } catch (error) {
    logger.debug('[urlState] Failed to parse sorting param:', error);
    return [];
  }
};
