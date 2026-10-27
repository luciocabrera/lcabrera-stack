import type { GroupAggregate } from './group-query-builder.types.ts';

import {
  AGGREGATE_SQL,
  COUNT_ROWS_ALIAS,
} from './group-query-builder.constants.ts';

export const resolveAggregateAlias = (aggregate: GroupAggregate): string => {
  if (aggregate.alias !== undefined) {
    return aggregate.alias;
  }

  if (aggregate.column === undefined) {
    return COUNT_ROWS_ALIAS;
  }

  const spec = AGGREGATE_SQL[aggregate.fn];
  const prefix = spec.distinct ? `${spec.sql}_distinct` : spec.sql;

  const { column } = aggregate;

  return typeof column === 'string'
    ? `${prefix}_${column}`
    : `${prefix}_${column.source}_${column.column}`;
};
