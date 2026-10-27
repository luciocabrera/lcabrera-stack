import type { ClauseAccumulator } from '../query-builder/append-comparison-clause.util.ts';
import type { GroupFilter } from './group-query-builder.types.ts';

import { appendComparisonClause } from '../query-builder/append-comparison-clause.util.ts';

type BuildHavingClauseArgs = {
  readonly expressions: readonly {
    readonly alias: string;
    readonly expression: string;
  }[];
  readonly groupFilters?: readonly GroupFilter[];
  readonly startParamIndex: number;
};

export const buildHavingClause = ({
  expressions,
  groupFilters = [],
  startParamIndex,
}: BuildHavingClauseArgs) => {
  const result = groupFilters.reduce<ClauseAccumulator>(
    (accumulator, groupFilter) => {
      const term = expressions.find(
        ({ alias }) => alias === groupFilter.aggregateAlias,
      )?.expression;

      if (term === undefined) {
        throw new Error(
          `Cannot filter groups by "${groupFilter.aggregateAlias}": it is not one of this query's aggregates.`,
        );
      }

      return appendComparisonClause({
        accumulator,
        comparison: groupFilter,
        term,
      });
    },
    { clauses: [], paramIndex: startParamIndex, values: [] },
  );

  return {
    nextParamIndex: result.paramIndex,
    text:
      result.clauses.length > 0 ? `HAVING ${result.clauses.join(' AND ')}` : '',
    values: result.values,
  };
};
