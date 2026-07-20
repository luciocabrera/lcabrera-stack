import type { ComparisonOperator, QueryFilter } from './QueryBuilder.types.ts';

import { assertColumnAllowed } from './assertColumnAllowed.util.ts';
import { assertSafeIdentifier } from './assertSafeIdentifier.util.ts';
import { quoteIdentifier } from './quoteIdentifier.util.ts';

export type ClauseAccumulator = {
  readonly clauses: readonly string[];
  readonly paramIndex: number;
  readonly values: readonly unknown[];
};

const OPERATOR_SQL: Record<ComparisonOperator, string> = {
  eq: '=',
  gt: '>',
  gte: '>=',
  ilike: 'ILIKE',
  in: 'IN',
  lt: '<',
  lte: '<=',
  neq: '<>',
  notIlike: 'NOT ILIKE',
};

type AppendFilterClauseArgs = {
  readonly accumulator: ClauseAccumulator;
  readonly allowedColumns?: readonly string[];
  readonly filter: QueryFilter;
};

/** Reducer step for buildWhereClause: validates the filter's column, then appends one SQL clause and its parameterized value(s). */
export const appendFilterClause = ({
  accumulator,
  allowedColumns,
  filter,
}: AppendFilterClauseArgs): ClauseAccumulator => {
  assertSafeIdentifier(filter.column);
  assertColumnAllowed({ allowedColumns, column: filter.column });

  const quotedColumn = quoteIdentifier(filter.column);

  if (filter.operator === 'in') {
    const inValues = Array.isArray(filter.value)
      ? filter.value
      : [filter.value];
    const placeholders = inValues.map(
      (_, index) => `$${accumulator.paramIndex + index}`,
    );

    return {
      clauses: [
        ...accumulator.clauses,
        `${quotedColumn} IN (${placeholders.join(', ')})`,
      ],
      paramIndex: accumulator.paramIndex + inValues.length,
      values: [...accumulator.values, ...inValues],
    };
  }

  return {
    clauses: [
      ...accumulator.clauses,
      `${quotedColumn} ${OPERATOR_SQL[filter.operator]} $${accumulator.paramIndex}`,
    ],
    paramIndex: accumulator.paramIndex + 1,
    values: [...accumulator.values, filter.value],
  };
};
