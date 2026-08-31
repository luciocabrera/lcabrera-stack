import type {
  BinaryOperator,
  QueryFilter,
  UnaryOperator,
} from './query-builder.types.ts';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { isUnaryFilter } from './is-unary-filter.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

export type ClauseAccumulator = {
  readonly clauses: readonly string[];
  readonly paramIndex: number;
  readonly values: readonly unknown[];
};

const OPERATOR_SQL: Record<BinaryOperator, string> = {
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

const UNARY_OPERATOR_SQL: Record<UnaryOperator, string> = {
  isNotNull: 'IS NOT NULL',
  isNull: 'IS NULL',
};

type AppendFilterClauseArgs = {
  readonly accumulator: ClauseAccumulator;
  readonly allowedColumns?: readonly string[];
  readonly filter: QueryFilter;
};

export const appendFilterClause = ({
  accumulator,
  allowedColumns,
  filter,
}: AppendFilterClauseArgs): ClauseAccumulator => {
  assertSafeIdentifier(filter.column);
  assertColumnAllowed({ allowedColumns, column: filter.column });

  const quotedColumn = quoteIdentifier(filter.column);

  if (isUnaryFilter(filter)) {
    return {
      clauses: [
        ...accumulator.clauses,
        `${quotedColumn} ${UNARY_OPERATOR_SQL[filter.operator]}`,
      ],
      paramIndex: accumulator.paramIndex,
      values: accumulator.values,
    };
  }

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
