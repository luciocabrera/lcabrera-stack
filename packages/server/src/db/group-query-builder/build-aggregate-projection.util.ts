import type { ReadScope } from '../query-builder/query-builder.types.ts';
import type { AliasedGroupAggregate } from './group-query-builder.types.ts';

import { buildWhereClause } from '../query-builder/build-where-clause.util.ts';
import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';
import { resolveColumnReference } from '../query-builder/resolve-column-reference.util.ts';
import { AGGREGATE_SQL } from './group-query-builder.constants.ts';

type AggregateExpression = {
  readonly alias: string;
  readonly expression: string;
};

type AggregateProjectionAccumulator = {
  readonly expressions: readonly AggregateExpression[];
  readonly paramIndex: number;
  readonly values: readonly unknown[];
};

type AggregateProjectionResult = {
  readonly expressions: readonly AggregateExpression[];
  readonly nextParamIndex: number;
  readonly text: string;
  readonly values: readonly unknown[];
};

type BuildAggregateProjectionArgs = {
  readonly aliased: readonly AliasedGroupAggregate[];
  readonly allowedColumns: readonly string[];
  readonly scope?: ReadScope;
  readonly startParamIndex: number;
};

export const buildAggregateProjection = ({
  aliased,
  allowedColumns,
  scope,
  startParamIndex,
}: BuildAggregateProjectionArgs): AggregateProjectionResult => {
  const result = aliased.reduce<AggregateProjectionAccumulator>(
    (accumulator, { aggregate, alias }) => {
      const spec = AGGREGATE_SQL[aggregate.fn];
      const target =
        aggregate.column === undefined
          ? '*'
          : resolveColumnReference({
              allowedColumns,
              reference: aggregate.column,
              scope,
            }).sql;
      const argument = spec.distinct ? `DISTINCT ${target}` : target;

      const filterClause = buildWhereClause({
        allowedColumns,
        filters: aggregate.filters,
        scope,
        startParamIndex: accumulator.paramIndex,
      });
      const filterSql =
        filterClause.text.length > 0 ? ` FILTER (${filterClause.text})` : '';

      return {
        expressions: [
          ...accumulator.expressions,
          { alias, expression: `${spec.sql}(${argument})${filterSql}` },
        ],
        paramIndex: filterClause.nextParamIndex,
        values: [...accumulator.values, ...filterClause.values],
      };
    },
    { expressions: [], paramIndex: startParamIndex, values: [] },
  );

  return {
    expressions: result.expressions,
    nextParamIndex: result.paramIndex,
    text: result.expressions
      .map(
        ({ alias, expression }) => `${expression} AS ${quoteIdentifier(alias)}`,
      )
      .join(', '),
    values: result.values,
  };
};
