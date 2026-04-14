import type { SortRule } from 'api-shared';
import { parseSortingRules } from '../../utils/parseSortingRules.util';

type ParseSortingArgs = {
  readonly allowedColumns: ReadonlySet<string>;
  readonly value: unknown;
};

/**
 * Parse and validate wide-alltypes sorting.
 */
export const parseWideAlltypesSorting = ({
  allowedColumns,
  value,
}: ParseSortingArgs): readonly SortRule[] => {
  return parseSortingRules({
    allowedColumns,
    invalidSortMessage: 'Invalid wide-alltypes sorting parameter.',
    unsupportedSortColumnMessage: (columnKey) =>
      `Unsupported wide-alltypes sort column: ${columnKey}`,
    value,
  });
};
