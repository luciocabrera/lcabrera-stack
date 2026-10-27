import type { ClauseAccumulator } from './append-comparison-clause.util.ts';
import type {
  ColumnReference,
  QueryFilter,
  ReadScope,
} from './query-builder.types.ts';

import { appendComparisonClause } from './append-comparison-clause.util.ts';
import { resolveColumnReference } from './resolve-column-reference.util.ts';

type AppendFilterClauseArgs = {
  readonly accumulator: ClauseAccumulator;
  readonly allowedColumns?: readonly string[];
  readonly filter: QueryFilter<ColumnReference>;
  readonly scope?: ReadScope;
};

export const appendFilterClause = ({
  accumulator,
  allowedColumns,
  filter,
  scope,
}: AppendFilterClauseArgs) =>
  appendComparisonClause({
    accumulator,
    comparison: filter,
    term: resolveColumnReference({
      allowedColumns,
      reference: filter.column,
      scope,
    }).sql,
  });
