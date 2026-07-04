import type { ColumnFiltersState } from '@repo/ui/components/Table';
import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

import { logger } from '@repo/ui/utils/logger';

import { deserializeFilter } from './deserializeFilter.util';

/**
 * Deserialize a compact filters URL param back to ColumnFiltersState.
 *
 * Infers filter types from value shapes and expands short operator codes.
 */
export const deserializeFiltersFromURL = <TData>(
  param: string,
): ColumnFiltersState<TData> => {
  try {
    const parsed = JSON.parse(param) as Record<string, unknown>;

    const result = Object.fromEntries(
      Object.entries(parsed)
        .map(
          ([columnKey, value]) =>
            [columnKey, deserializeFilter(value)] as const,
        )
        .filter(
          (entry): entry is [string, ColumnFilter] => entry[1] !== undefined,
        ),
    );

    return result as ColumnFiltersState<TData>;
  } catch (error) {
    logger.debug('[urlState] Failed to parse filters param:', error);
    return {} as ColumnFiltersState<TData>;
  }
};
