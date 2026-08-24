import type { GroupAggregate } from './group-query-builder.types.ts';

import {
  AGGREGATE_SQL,
  COUNT_ROWS_ALIAS,
} from './group-query-builder.constants.ts';

/**
 * The `distinct` flag is folded into the prefix rather than the SQL name, because `count`
 * and `countDistinct` share one SQL function and would otherwise derive the same alias for
 * the same column — a collision that Postgres reports as nothing at all.
 */
export const resolveAggregateAlias = (aggregate: GroupAggregate): string => {
  if (aggregate.alias !== undefined) {
    return aggregate.alias;
  }

  if (aggregate.column === undefined) {
    return COUNT_ROWS_ALIAS;
  }

  const spec = AGGREGATE_SQL[aggregate.fn];
  const prefix = spec.distinct ? `${spec.sql}_distinct` : spec.sql;

  return `${prefix}_${aggregate.column}`;
};
