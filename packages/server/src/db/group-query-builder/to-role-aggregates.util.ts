import type {
  AggregateFn,
  ColumnAnalyticalRole,
} from './group-query-builder.types.ts';

import { AGGREGATE_SQL } from './group-query-builder.constants.ts';

const AGGREGATES_BY_ROLE: Readonly<
  Record<ColumnAnalyticalRole, readonly AggregateFn[]>
> = {
  dimension: ['boolAnd', 'boolOr', 'count', 'countDistinct', 'max', 'min'],
  fact: ['avg', 'count', 'countDistinct', 'max', 'min', 'sum'],
  unsupported: [],
};

type ToRoleAggregatesArgs = {
  readonly availableSqlNames: readonly string[];
  readonly role: ColumnAnalyticalRole;
};

export const toRoleAggregates = ({
  availableSqlNames,
  role,
}: ToRoleAggregatesArgs): readonly AggregateFn[] =>
  AGGREGATES_BY_ROLE[role].filter((fn) =>
    availableSqlNames.includes(AGGREGATE_SQL[fn].sql),
  );
