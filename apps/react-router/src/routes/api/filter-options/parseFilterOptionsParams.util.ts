import { DEFAULT_FILTER_PAGE_SIZE } from '@repo/ui/components/Table/Table.constants';

import { parsePositiveInteger } from './parsePositiveInteger.util';

type FilterOptionsParams = {
  readonly columnName: string;
  readonly limit: number;
  readonly offset: number;
  readonly schemaName: string;
  readonly tableName: string;
};

/**
 * Parses and validates the /_api/filter-options search params. Returns the
 * distinct-fetch params or undefined when a required source identifier is
 * missing (the loader answers 400; allow-list authorization happens in the
 * BFF via parseDistinctSource).
 */
export const parseFilterOptionsParams = (
  searchParams: URLSearchParams,
): FilterOptionsParams | undefined => {
  const columnName = searchParams.get('columnName');
  const schemaName = searchParams.get('schemaName');
  const tableName = searchParams.get('tableName');

  if (!columnName || !schemaName || !tableName) {
    return undefined;
  }

  return {
    columnName,
    limit: parsePositiveInteger({
      fallback: DEFAULT_FILTER_PAGE_SIZE,
      value: searchParams.get('limit') ?? undefined,
    }),
    offset: parsePositiveInteger({
      fallback: 0,
      value: searchParams.get('offset') ?? undefined,
    }),
    schemaName,
    tableName,
  };
};
