import type { AliasedGroupAggregate } from './group-query-builder.types.ts';

import { buildWhereClause } from '../query-builder/build-where-clause.util.ts';
import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';
import { AGGREGATE_SQL } from './group-query-builder.constants.ts';

type AggregateProjectionAccumulator = {
  readonly paramIndex: number;
  readonly parts: readonly string[];
  readonly values: readonly unknown[];
};

type AggregateProjectionResult = {
  readonly nextParamIndex: number;
  readonly text: string;
  readonly values: readonly unknown[];
};

type BuildAggregateProjectionArgs = {
  readonly aliased: readonly AliasedGroupAggregate[];
  readonly allowedColumns: readonly string[];
  readonly startParamIndex: number;
};

/**
 * The aggregate half of the SELECT list.
 *
 * `FILTER (WHERE …)` is `buildWhereClause` verbatim — its output already starts
 * with the `WHERE` keyword the syntax wants, so a filtered aggregate needs no
 * filter code of its own and its values thread through the same unbroken `$n`
 * run.
 *
 * That is also why this returns `nextParamIndex`: a filtered aggregate claims
 * the leading placeholders, so the query's own `WHERE` no longer starts at
 * `$1`. `build-update-query.util.ts` has the same shape.
 */
export const buildAggregateProjection = ({
  aliased,
  allowedColumns,
  startParamIndex,
}: BuildAggregateProjectionArgs): AggregateProjectionResult => {
  const result = aliased.reduce<AggregateProjectionAccumulator>(
    (accumulator, { aggregate, alias }) => {
      const spec = AGGREGATE_SQL[aggregate.fn];
      const target =
        aggregate.column === undefined
          ? '*'
          : quoteIdentifier(aggregate.column);
      const argument = spec.distinct ? `DISTINCT ${target}` : target;

      const filterClause = buildWhereClause({
        allowedColumns,
        filters: aggregate.filters,
        startParamIndex: accumulator.paramIndex,
      });
      const filterSql =
        filterClause.text.length > 0 ? ` FILTER (${filterClause.text})` : '';

      return {
        paramIndex: filterClause.nextParamIndex,
        parts: [
          ...accumulator.parts,
          `${spec.sql}(${argument})${filterSql} AS ${quoteIdentifier(alias)}`,
        ],
        values: [...accumulator.values, ...filterClause.values],
      };
    },
    { paramIndex: startParamIndex, parts: [], values: [] },
  );

  return {
    nextParamIndex: result.paramIndex,
    text: result.parts.join(', '),
    values: result.values,
  };
};
