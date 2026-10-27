import type { BinaryOperator, UnaryOperator } from './query-builder.types.ts';

import { isUnaryFilter } from './is-unary-filter.util.ts';

export type ClauseAccumulator = {
  readonly clauses: readonly string[];
  readonly paramIndex: number;
  readonly values: readonly unknown[];
};

type AppendComparisonClauseArgs = {
  readonly accumulator: ClauseAccumulator;
  readonly comparison:
    | { readonly operator: BinaryOperator; readonly value: unknown }
    | { readonly operator: UnaryOperator };
  readonly term: string;
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

export const appendComparisonClause = ({
  accumulator,
  comparison,
  term,
}: AppendComparisonClauseArgs): ClauseAccumulator => {
  if (isUnaryFilter(comparison)) {
    return {
      clauses: [
        ...accumulator.clauses,
        `${term} ${UNARY_OPERATOR_SQL[comparison.operator]}`,
      ],
      paramIndex: accumulator.paramIndex,
      values: accumulator.values,
    };
  }

  if (comparison.operator === 'in') {
    const inValues = Array.isArray(comparison.value)
      ? comparison.value
      : [comparison.value];
    const placeholders = inValues.map(
      (_, index) => `$${accumulator.paramIndex + index}`,
    );

    return {
      clauses: [
        ...accumulator.clauses,
        `${term} IN (${placeholders.join(', ')})`,
      ],
      paramIndex: accumulator.paramIndex + inValues.length,
      values: [...accumulator.values, ...inValues],
    };
  }

  return {
    clauses: [
      ...accumulator.clauses,
      `${term} ${OPERATOR_SQL[comparison.operator]} $${accumulator.paramIndex}`,
    ],
    paramIndex: accumulator.paramIndex + 1,
    values: [...accumulator.values, comparison.value],
  };
};
