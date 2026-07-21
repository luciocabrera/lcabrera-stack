import { parsePositiveInteger } from '@lcabrera/utils/numbers/parse-positive-integer.util';

type FilterOptionsParams = {
  readonly columnName: string;
  readonly limit: number;
  readonly offset: number;
  readonly schemaName: string;
  readonly tableName: string;
};

type ParseFilterOptionsParamsArgs = {
  readonly defaultPageSize: number;
  readonly searchParams: URLSearchParams;
};

/**
 * Parse and validate the distinct-filter-options search params into the params
 * `fetchDistinctValues` expects. Returns `undefined` when a required source
 * identifier (schema/table/column) is missing so the caller can answer `400`;
 * allow-list authorization happens downstream in the BFF.
 *
 * The page-size fallback is injected via `defaultPageSize` rather than read
 * from a UI constant, keeping this server-side helper free of any `@lcabrera/ui`
 * dependency — the caller passes its own default.
 */
export const parseFilterOptionsParams = ({
  defaultPageSize,
  searchParams,
}: ParseFilterOptionsParamsArgs): FilterOptionsParams | undefined => {
  const columnName = searchParams.get('columnName');
  const schemaName = searchParams.get('schemaName');
  const tableName = searchParams.get('tableName');

  if (!columnName || !schemaName || !tableName) {
    return undefined;
  }

  return {
    columnName,
    limit: parsePositiveInteger({
      fallback: defaultPageSize,
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
