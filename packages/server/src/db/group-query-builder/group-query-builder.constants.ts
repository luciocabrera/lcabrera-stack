import { OLAP_GROUP_PERIODS } from '@lcabrera/api/olap/olap.constants';

import type {
  AggregateFn,
  AggregateSpec,
  BuiltGroupQuery,
  GroupingMode,
  GroupKeyPeriod,
} from './group-query-builder.types.ts';

/**
 * The value is a spec rather than a bare string because `countDistinct` and `count` share
 * one SQL function and differ only by the `DISTINCT` keyword.
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
 * Types admitted as dimensions by **name** rather than by `typcategory`, and the only
 * place ADR-058's Gate 1 is not a derivation.
 * `uuid` needs this because Postgres files it under category `U` beside `jsonb`, `xml`,
 * `bytea` and `tsvector` — types the Table cannot render — so no structural property of a
 * catalogue row separates it from them.
 * Entries are **schema-qualified**, and that is not decoration: type names are per-schema,
 * so `CREATE TYPE app.uuid AS (…)` yields a composite whose `typname` is `uuid`. Matching
 * on the bare name would admit it as a dimension — a type the Table cannot render, which
 * is the exact failure this gate exists to prevent.
 * Being an identifier also carries a second rule: these types must demonstrate low
 * cardinality before they are a legal group key, the same bar a fact clears, because a
 * `uuid` column is far more often a key than a label. That is why
 * `refuse-group-key.util.ts` consults `isIdentifierType` too rather than treating them as
 * ordinary dimensions.
 */
export const IDENTIFIER_TYPE_NAMES: ReadonlySet<string> = new Set([
  'pg_catalog.uuid',
]);

export const COUNT_ROWS_ALIAS = 'count_rows';

/**
 * The alias of the variadic `GROUPING(k₁, …, kₙ)` projection. Typed off
 * `BuiltGroupQuery` so the literal the result advertises and the literal the
 * SQL emits cannot drift apart.
 */
export const GROUP_MASK_ALIAS: BuiltGroupQuery['maskAlias'] = 'group_mask';

/**
 * `count(DISTINCT …)` costs a per-group tuplesort that is redone for every grouping set,
 * so a second one multiplies the most expensive part of the query.
 */
export const MAX_COUNT_DISTINCT_AGGREGATES = 1;

/**
 * A temporal key is measured at the granularity it is grouped at, not raw —
 * `date_trunc('month', c)` and `c` are different keys and the guard is asked about the one
 * the query will emit (#786).
 */
export const MAX_GROUP_KEY_DISTINCT = 1000;

export const GROUP_KEY_PERIODS: readonly GroupKeyPeriod[] = OLAP_GROUP_PERIODS;

export const PERIOD_MEAN_DAYS: Readonly<Record<GroupKeyPeriod, number>> = {
  day: 1,
  month: 365.2425 / 12,
  quarter: 365.2425 / 4,
  year: 365.2425,
};

/**
 * Types a granularity may be applied to, schema-qualified for `IDENTIFIER_TYPE_NAMES`'
 * reason: type names are per-schema, so a composite `app.date` reports `typname = 'date'`
 * exactly like the built-in.
 * `time` and `timetz` are category `D` and are deliberately out: `date_trunc` accepts
 * them, and truncating a time of day to a month is not a question anybody asked.
 */
export const PERIOD_CAPABLE_TYPE_NAMES: ReadonlySet<string> = new Set([
  'pg_catalog.date',
  'pg_catalog.timestamp',
  'pg_catalog.timestamptz',
]);

/**
 * The `date_trunc` field each granularity maps to. The value reaching SQL comes from here
 * and never from the caller's string, so an unvalidated period cannot become an identifier.
 */
export const PERIOD_SQL_FIELD: Readonly<Record<GroupKeyPeriod, string>> = {
  day: 'day',
  month: 'month',
  quarter: 'quarter',
  year: 'year',
};

/**
 * The time zone every `timestamptz` truncation is performed in.
 * `date_trunc`'s two-argument form resolves a `timestamptz` against the **session**
 * `TimeZone`, so the same request would put a 23:30 order in December for one caller and
 * in January for another, with nothing in the result saying which happened.
 */
export const GROUP_PERIOD_TIME_ZONE = 'UTC';

/**
 * Four is where an indented tree stops being legible, and it is also what bounds the
 * result: a rollup at depth 4 is five grouping sets and roughly one sort, where a cube at
 * the same depth is sixteen sets whose product blows past any sane row budget.
 */
export const MAX_GROUP_KEYS = 4;

/**
 * The depth cap per mode, closed over `GroupingMode` so a new mode must state its own
 * bound rather than inherit one.
 * Cube stops a key earlier than the others because its set count is `2ⁿ`, not `n+1` — the
 * sentence above already prices depth 4 at sixteen sets. Three is eight, which the row
 * budget absorbs.
 * **It has to be a construction-time rule, and the cardinality rail is exactly why.** That
 * rail returns `unknown` when any key lacks a `pg_stats` row, and ADR-066 answers
 * `unknown` with warn-and-proceed so grouping survives a fresh restore. So on an
 * unanalysed table the estimate cannot refuse anything, and a depth-4 cube would run its
 * sixteen sets under nothing but the row backstop. A bound that disappears on the
 * least-analysed tables is not a bound.
 */
export const MAX_KEYS_BY_GROUPING: Readonly<Record<GroupingMode, number>> = {
  cube: 3,
  flat: MAX_GROUP_KEYS,
  rollup: MAX_GROUP_KEYS,
};

/**
 * Estimated result rows past which a grouped read is refused outright.
 * The estimate is an upper bound — `∏dₖ` assumes every key combination occurs — so it
 * over-refuses on sparse data. That is the safe direction for a hard refusal, and it is
 * why the warn threshold below exists rather than this being the only rail (ADR-066).
 */
export const MAX_GROUP_ROWS_REFUSE = 50_000;

/**
 * Estimated result rows past which a grouped read is warned about but still run.
 * Also the row ceiling when the estimate could not be computed at all: an unanalysed table
 * proceeds under a `LIMIT` of this plus one, and hitting that limit converts the warning
 * into a refusal.
 */
export const MAX_GROUP_ROWS_WARN = 5000;

/**
 * `NAMEDATALEN - 1`. Past it Postgres truncates with only a `NOTICE`, and `pg` then folds
 * two truncation-equal aliases into one row key holding the second value — losing the
 * first column with no error anywhere. Probed; see ADR-059.
 */
export const MAX_IDENTIFIER_LENGTH = 63;

/**
 * At or above this share of the row count a column is treated as unique-ish and
 * refused, because a "group" per row is not a grouping. Deliberately below 1:
 * `n_distinct` is an estimate, so an exact-equality test would miss the primary
 * key it exists to catch.
 */
export const UNIQUE_ISH_DISTINCT_RATIO = 0.95;
