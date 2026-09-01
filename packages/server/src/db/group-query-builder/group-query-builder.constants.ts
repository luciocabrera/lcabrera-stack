import { OLAP_GROUP_PERIODS } from '@lcabrera/api/olap/olap.constants';

import type {
  AggregateFn,
  AggregateSpec,
  BuiltGroupQuery,
  GroupingMode,
  GroupKeyPeriod,
} from './group-query-builder.types.ts';

export const AGGREGATE_SQL: Record<AggregateFn, AggregateSpec> = {
  avg: { distinct: false, sql: 'avg' },
  boolAnd: { distinct: false, sql: 'bool_and' },
  boolOr: { distinct: false, sql: 'bool_or' },
  count: { distinct: false, sql: 'count' },
  countDistinct: { distinct: true, sql: 'count' },
  max: { distinct: false, sql: 'max' },
  min: { distinct: false, sql: 'min' },
  sum: { distinct: false, sql: 'sum' },
};

export const AGGREGATE_SQL_NAMES: readonly string[] = [
  ...new Set(Object.values(AGGREGATE_SQL).map((spec) => spec.sql)),
].toSorted((a, b) => a.localeCompare(b));

export const IDENTIFIER_TYPE_NAMES: ReadonlySet<string> = new Set([
  'pg_catalog.uuid',
]);

export const COUNT_ROWS_ALIAS = 'count_rows';

export const GROUP_MASK_ALIAS: BuiltGroupQuery['maskAlias'] = 'group_mask';

export const MAX_COUNT_DISTINCT_AGGREGATES = 1;

export const MAX_GROUP_KEY_DISTINCT = 1000;

export const GROUP_KEY_PERIODS: readonly GroupKeyPeriod[] = OLAP_GROUP_PERIODS;

export const PERIOD_MEAN_DAYS: Readonly<Record<GroupKeyPeriod, number>> = {
  day: 1,
  month: 365.2425 / 12,
  quarter: 365.2425 / 4,
  year: 365.2425,
};

export const PERIOD_CAPABLE_TYPE_NAMES: ReadonlySet<string> = new Set([
  'pg_catalog.date',
  'pg_catalog.timestamp',
  'pg_catalog.timestamptz',
]);

export const PERIOD_SQL_FIELD: Readonly<Record<GroupKeyPeriod, string>> = {
  day: 'day',
  month: 'month',
  quarter: 'quarter',
  year: 'year',
};

export const GROUP_PERIOD_TIME_ZONE = 'UTC';

export const MAX_GROUP_KEYS = 4;

export const MAX_KEYS_BY_GROUPING: Readonly<Record<GroupingMode, number>> = {
  cube: 3,
  flat: MAX_GROUP_KEYS,
  rollup: MAX_GROUP_KEYS,
};

export const MAX_GROUP_ROWS_REFUSE = 50_000;

export const MAX_GROUP_ROWS_WARN = 5000;

export const MAX_IDENTIFIER_LENGTH = 63;

export const UNIQUE_ISH_DISTINCT_RATIO = 0.95;
