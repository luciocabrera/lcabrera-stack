import type {
  AggregateFn,
  AggregateSpec,
} from './group-query-builder.types.ts';

/**
 * Modelled on `OPERATOR_SQL`: a closed exhaustive map, so a new `AggregateFn`
 * is a type error rather than a silent gap. The value is a spec rather than a
 * bare string because `countDistinct` and `count` share one SQL function and
 * differ only by the `DISTINCT` keyword.
 */
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

/**
 * The distinct SQL names to probe the catalogue with — `count` covers both
 * `count` and `countDistinct`, so probing by `AggregateFn` would ask twice.
 */
export const AGGREGATE_SQL_NAMES: readonly string[] = [
  ...new Set(Object.values(AGGREGATE_SQL).map((spec) => spec.sql)),
].toSorted((a, b) => a.localeCompare(b));
