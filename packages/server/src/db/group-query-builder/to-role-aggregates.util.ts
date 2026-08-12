import type {
  AggregateFn,
  ColumnAnalyticalRole,
} from './group-query-builder.types.ts';

import { AGGREGATE_SQL } from './group-query-builder.constants.ts';

/**
 * What each role permits (ADR-058 Gate 1). `boolAnd`/`boolOr` sit under
 * `dimension` because a boolean is one; Gate 2 then drops them everywhere else,
 * since Postgres defines no `bool_and(numeric)`.
 */
const AGGREGATES_BY_ROLE: Readonly<
  Record<ColumnAnalyticalRole, readonly AggregateFn[]>
> = {
  dimension: ['boolAnd', 'boolOr', 'count', 'countDistinct', 'max', 'min'],
  fact: ['avg', 'count', 'countDistinct', 'max', 'min', 'sum'],
  unsupported: [],
};

type ToRoleAggregatesArgs = {
  /** SQL aggregate names the catalogue confirmed exist for the column's type. */
  readonly availableSqlNames: readonly string[];
  readonly role: ColumnAnalyticalRole;
};

/**
 * Both gates applied to the aggregate menu: the role sets the ceiling, and the
 * catalogue removes what does not exist for the real type. Composing them is
 * what reconciles the design's per-`dataType` table with Postgres — a boolean
 * loses `min`/`max` (no such aggregate) and keeps `bool_and`/`bool_or`, and a
 * `date` loses `avg` while keeping `min`/`max`, without either rule naming a
 * single type.
 */
export const toRoleAggregates = ({
  availableSqlNames,
  role,
}: ToRoleAggregatesArgs): readonly AggregateFn[] =>
  AGGREGATES_BY_ROLE[role].filter((fn) =>
    availableSqlNames.includes(AGGREGATE_SQL[fn].sql),
  );
