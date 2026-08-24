import type { ClauseAccumulator } from './append-filter-clause.util.ts';
import type {
  QueryCursor,
  QueryFilter,
  QuerySort,
} from './query-builder.types.ts';

import { appendFilterClause } from './append-filter-clause.util.ts';
import { buildKeysetClause } from './build-keyset-clause.util.ts';

type BuildWhereClauseArgs = {
  readonly allowedColumns?: readonly string[];
  /** Keyset cursor to resume after; needs `sort` to describe its tuple. */
  readonly cursor?: QueryCursor;
  readonly filters?: readonly QueryFilter[];
  readonly sort?: readonly QuerySort[];
  readonly startParamIndex?: number;
};

type WhereClauseResult = {
  readonly nextParamIndex: number;
  readonly text: string;
  readonly values: readonly unknown[];
};

/**
 * Values are always parameterized ($1, $2, ...), never interpolated; each filter's column
 * runs through both identifier checks via appendFilterClause.
 * A `cursor` contributes one more conjunct — the keyset seek predicate — bound after the
 * filters, so a filtered keyset page numbers its placeholders in one unbroken run.
 */
export const buildWhereClause = ({
  allowedColumns,
  cursor,
  filters = [],
  sort,
  startParamIndex = 1,
}: BuildWhereClauseArgs): WhereClauseResult => {
  const result = filters.reduce<ClauseAccumulator>(
    (accumulator, filter) =>
      appendFilterClause({ accumulator, allowedColumns, filter }),
    { clauses: [], paramIndex: startParamIndex, values: [] },
  );

  const keyset = buildKeysetClause({
    allowedColumns,
    cursor,
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
