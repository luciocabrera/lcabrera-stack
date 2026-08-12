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

/**
 * Types admitted as dimensions by **name** rather than by `typcategory`, and the
 * only place ADR-058's Gate 1 is not a derivation.
 *
 * `uuid` needs this because Postgres files it under category `U` beside `jsonb`,
 * `xml`, `bytea` and `tsvector` — types the Table cannot render — so no
 * structural property of a catalogue row separates it from them. A `uuid` row
 * and a `jsonb` row report the same category, the same equality answer and the
 * same `{count}` aggregate set; only the name differs.
 *
 * Entries are **schema-qualified**, and that is not decoration: type names are
 * per-schema, so `CREATE TYPE app.uuid AS (…)` yields a composite whose
 * `typname` is `uuid`. Matching on the bare name would admit it as a dimension —
 * a type the Table cannot render, which is the exact failure this gate exists to
 * prevent.
 *
 * Being an identifier also carries a second rule: these types must demonstrate
 * low cardinality before they are a legal group key, the same bar a fact clears,
 * because a `uuid` column is far more often a key than a label. That is why
 * `refuse-group-key.util.ts` consults `isIdentifierType` too rather than
 * treating them as ordinary dimensions.
 *
 * Keep it small. Every entry is a type someone has to maintain by hand, which is
 * the cost the category derivation exists to avoid.
 */
export const IDENTIFIER_TYPE_NAMES: ReadonlySet<string> = new Set([
  'pg_catalog.uuid',
]);

/**
 * A group key above this many distinct values produces a tree nobody reads and
 * a payload nobody wants. It bounds the **key**, which is why it lives here
 * rather than with the result-size guard rails.
 */
export const MAX_GROUP_KEY_DISTINCT = 1000;

/**
 * At or above this share of the row count a column is treated as unique-ish and
 * refused, because a "group" per row is not a grouping. Deliberately below 1:
 * `n_distinct` is an estimate, so an exact-equality test would miss the primary
 * key it exists to catch.
 */
export const UNIQUE_ISH_DISTINCT_RATIO = 0.95;
