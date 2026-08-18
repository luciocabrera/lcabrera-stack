import type {
  AggregateFn,
  AggregateSpec,
  BuiltGroupQuery,
  GroupingMode,
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

/** The alias `count(*)` is projected under; `count_rows` has no column to name it after. */
export const COUNT_ROWS_ALIAS = 'count_rows';

/**
 * The alias of the variadic `GROUPING(k₁, …, kₙ)` projection. Typed off
 * `BuiltGroupQuery` so the literal the result advertises and the literal the
 * SQL emits cannot drift apart.
 */
export const GROUP_MASK_ALIAS: BuiltGroupQuery['maskAlias'] = 'group_mask';

/**
 * `count(DISTINCT …)` costs a per-group tuplesort that is redone for every
 * grouping set, so a second one multiplies the most expensive part of the
 * query. One is a budget, not a limitation of the SQL.
 */
export const MAX_COUNT_DISTINCT_AGGREGATES = 1;

/**
 * A group key above this many distinct values produces a tree nobody reads and
 * a payload nobody wants. It bounds the **key**, which is why it lives here
 * rather than with the result-size guard rails.
 */
export const MAX_GROUP_KEY_DISTINCT = 1000;

/**
 * Depth cap, checked before any round trip. Four is where an indented tree stops
 * being legible, and it is also what bounds the result: a rollup at depth 4 is
 * five grouping sets and roughly one sort, where a cube at the same depth is
 * sixteen sets whose product blows past any sane row budget.
 */
export const MAX_GROUP_KEYS = 4;

/**
 * The depth cap per mode, closed over `GroupingMode` so a new mode must state
 * its own bound rather than inherit one.
 *
 * Cube stops a key earlier than the others because its set count is `2ⁿ`, not
 * `n+1` — the sentence above already prices depth 4 at sixteen sets. Three is
 * eight, which the row budget absorbs.
 *
 * **It has to be a construction-time rule, and the cardinality rail is exactly
 * why.** That rail returns `unknown` when any key lacks a `pg_stats` row, and
 * ADR-066 answers `unknown` with warn-and-proceed so grouping survives a fresh
 * restore. So on an unanalysed table the estimate cannot refuse anything, and a
 * depth-4 cube would run its sixteen sets under nothing but the row backstop.
 * A bound that disappears on the least-analysed tables is not a bound.
 */
export const MAX_KEYS_BY_GROUPING: Readonly<Record<GroupingMode, number>> = {
  cube: 3,
  flat: MAX_GROUP_KEYS,
  rollup: MAX_GROUP_KEYS,
};

/**
 * Estimated result rows past which a grouped read is refused outright — roughly
 * 10 MB through a server-rendered payload, which is not a page anyone waits for.
 *
 * The estimate is an upper bound — `∏dₖ` assumes every key combination occurs —
 * so it over-refuses on sparse data. That is the safe direction for a *hard*
 * refusal, and it is why the warn threshold below exists rather than this being
 * the only rail (ADR-066, which names the query that re-derives the gap).
 */
export const MAX_GROUP_ROWS_REFUSE = 50_000;

/**
 * Estimated result rows past which a grouped read is warned about but still run
 * — roughly 1 MB of payload, past what a person reads and still recoverable.
 *
 * It doubles as the row ceiling when the estimate could not be computed at all:
 * an unanalysed table warns and proceeds under a `LIMIT` of this plus one, and
 * hitting that limit is what converts the warning into a refusal after the fact.
 * One mechanism, two jobs.
 */
export const MAX_GROUP_ROWS_WARN = 5000;

/**
 * `NAMEDATALEN - 1`. Past it Postgres truncates with only a `NOTICE`, and `pg`
 * then folds two truncation-equal aliases into one row key holding the second
 * value — losing the first column with no error anywhere. Probed; see ADR-059.
 */
export const MAX_IDENTIFIER_LENGTH = 63;

/**
 * At or above this share of the row count a column is treated as unique-ish and
 * refused, because a "group" per row is not a grouping. Deliberately below 1:
 * `n_distinct` is an estimate, so an exact-equality test would miss the primary
 * key it exists to catch.
 */
export const UNIQUE_ISH_DISTINCT_RATIO = 0.95;
