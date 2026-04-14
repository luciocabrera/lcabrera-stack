import type { SortRule } from 'api-shared';
import { parseSortingRules } from '../../utils/parseSortingRules.util';

type ParseSortingArgs = {
  readonly allowedColumns: ReadonlySet<string>;
  readonly value: unknown;
};

/**
 * Parse and validate car-sales sorting.
 */
export const parseCarSalesSorting = ({
  allowedColumns,
  value,
}: ParseSortingArgs): readonly SortRule[] => {
  return parseSortingRules({
    allowedColumns,
    invalidSortMessage: 'Invalid car sales sorting parameter.',
    unsupportedSortColumnMessage: (columnKey) =>
      `Unsupported car sales sort column: ${columnKey}`,
    value,
  });
};
