import type { ClauseAccumulator } from './append-comparison-clause.util.ts';
import type {
  ColumnReference,
  QueryCursor,
  QueryFilter,
  QuerySort,
  ReadScope,
} from './query-builder.types.ts';

import { appendFilterClause } from './append-filter-clause.util.ts';
import { buildKeysetClause } from './build-keyset-clause.util.ts';

type BuildWhereClauseArgs = {
  readonly allowedColumns?: readonly string[];
  readonly cursor?: QueryCursor;
  readonly filters?: readonly QueryFilter<ColumnReference>[];
  readonly scope?: ReadScope;
  readonly sort?: readonly QuerySort<ColumnReference>[];
  readonly startParamIndex?: number;
};

type WhereClauseResult = {
  readonly nextParamIndex: number;
  readonly text: string;
  readonly values: readonly unknown[];
};

export const buildWhereClause = ({
  allowedColumns,
  cursor,
  filters = [],
  scope,
  sort,
  startParamIndex = 1,
}: BuildWhereClauseArgs): WhereClauseResult => {
  const result = filters.reduce<ClauseAccumulator>(
    (accumulator, filter) =>
      appendFilterClause({ accumulator, allowedColumns, filter, scope }),
    { clauses: [], paramIndex: startParamIndex, values: [] },
  );

  const keyset = buildKeysetClause({
    allowedColumns,
    cursor,
    scope,
    sort,
    startParamIndex: result.paramIndex,
  });

  const clauses =
    keyset.text.length > 0 ? [...result.clauses, keyset.text] : result.clauses;

  return {
    nextParamIndex: keyset.nextParamIndex,
    text: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values: [...result.values, ...keyset.values],
  };
};
