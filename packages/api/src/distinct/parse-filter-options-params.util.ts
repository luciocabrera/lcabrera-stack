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
