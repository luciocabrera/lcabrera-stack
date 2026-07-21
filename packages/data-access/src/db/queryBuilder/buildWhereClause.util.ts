import type { QueryFilter } from './queryBuilder.types.ts';

import {
  appendFilterClause,
  type ClauseAccumulator,
} from './appendFilterClause.util.ts';

type BuildWhereClauseArgs = {
  readonly allowedColumns?: readonly string[];
  readonly filters?: readonly QueryFilter[];
  readonly startParamIndex?: number;
};

type WhereClauseResult = {
  readonly nextParamIndex: number;
  readonly text: string;
  readonly values: readonly unknown[];
};

/** Values are always parameterized ($1, $2, ...), never interpolated; each filter's column runs through both identifier checks via appendFilterClause. */
export const buildWhereClause = ({
  allowedColumns,
  filters = [],
  startParamIndex = 1,
}: BuildWhereClauseArgs): WhereClauseResult => {
  const result = filters.reduce<ClauseAccumulator>(
    (accumulator, filter) =>
      appendFilterClause({ accumulator, allowedColumns, filter }),
    { clauses: [], paramIndex: startParamIndex, values: [] },
  );

  return {
    nextParamIndex: result.paramIndex,
    text:
      result.clauses.length > 0 ? `WHERE ${result.clauses.join(' AND ')}` : '',
    values: result.values,
  };
};
