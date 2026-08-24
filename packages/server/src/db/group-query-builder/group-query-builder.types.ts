import type { OlapGroupPeriod } from '@lcabrera/api/olap/olap.types';

import type { QueryFilter } from '../query-builder/query-builder.types.ts';

/**
 * `countDistinct` is a separate member rather than a flag because it is the one that costs
 * a per-group tuplesort.
 */
export type AggregateFn =
  | 'avg'
  | 'boolAnd'
  | 'boolOr'
  | 'count'
  | 'countDistinct'
  | 'max'
  | 'min'
  | 'sum';

/** How an aggregate reaches SQL — `countDistinct` cannot be a bare name. */
export type AggregateSpec = {
  readonly distinct: boolean;
  readonly sql: string;
};

/**
 * Resolved once in `buildGroupQuery`, so the alias the assertions check, the alias the SQL
 * emits and the alias the caller decodes by are the same string.
 */
export type AliasedGroupAggregate = {
  readonly aggregate: GroupAggregate;
  readonly alias: string;
};

/** What `buildGroupQuery` emitted, so a caller can decode the row it gets back. */
export type BuiltGroupAggregate = {
  readonly alias: string;
  readonly column?: string;
  readonly fn: AggregateFn;
};

export type BuiltGroupQuery = {
  readonly aggregates: readonly BuiltGroupAggregate[];
  /**
   * The `GROUPING()` value of each emitted set, in emission order. Bit
   * `keys.length - 1 - i` is 1 when `keys[i]` was rolled up in that set, which
   * is how a structural NULL is told apart from a real one.
   */
  readonly groupingSetMasks: readonly number[];
  readonly guardRails: GroupGuardRails;
  /** The group keys, ordered — the bit positions above are relative to this. */
  readonly keys: readonly string[];
  readonly maskAlias: 'group_mask';
  readonly text: string;
  readonly values: readonly unknown[];
};

/** Gate 1 of ADR-058. */
export type ColumnAnalyticalRole = 'dimension' | 'fact' | 'unsupported';

export type ColumnCapabilitiesQueryDescriptor = {
  readonly columns: readonly string[];
  readonly schema: string;
  readonly table: string;
};

export type ColumnCapabilityRow = {
  readonly aggregates: readonly string[];
  readonly column: string;
  readonly hasEquality: boolean;
  /**
   * Whether `pg_stats` holds a row for this column at all — and the only thing
   * that makes `nDistinct` meaningful, since the query coalesces the absent
   * case to a zero that would otherwise be indistinguishable from Postgres
   * reporting undefined distinctness.
   */
  readonly hasStats: boolean;
  readonly nDistinct: number;
  readonly relTuples: number;
  /**
   * How many days the column's `pg_stats` histogram spans; absent when the column is not a
   * date/timestamp or has no histogram to measure.
   * SQL NULL arrives here from `pg` as an absence, and `resolveColumnCapability` narrows
   * anything that is not a finite number to one — which also catches the `numeric` a bare
   * `extract(epoch …)` would hand back as a **string**.
   */
  readonly spanDays?: number;
  readonly typeCategory: string;
  readonly typeName: string;
  /**
   * Load-bearing for the named identifier exception: type names are per-schema, so a
   * user-defined `app.uuid` reports `typname = 'uuid'` exactly like `pg_catalog.uuid` does,
   * and only the namespace tells them apart.
   */
  readonly typeNamespace: string;
};

/**
 * Discriminated on `canGroup` so that a refusal **must** carry its reason: the UI says why
 * rather than hiding the column, and a builder can put the reason straight into an error
 * without a fallback for a state that cannot occur.
 * `refusal?: never` on the groupable arm keeps `capability.refusal` readable without
 * narrowing first, which is what most consumers want.
 */
export type ColumnGroupingCapability =
  | (ColumnCapabilityShared & {
      readonly canGroup: false;
      readonly refusal: GroupKeyRefusalReason;
    })
  | (ColumnCapabilityShared & {
      readonly canGroup: true;
      readonly refusal?: never;
    });

/**
 * `undefinedDistinctness` is `n_distinct = 0` — Postgres stating the type has no
 * equality operator, which ADR-058 forbids reading as `unknown`. `unknown` is
 * the genuinely absent case (no `pg_stats` row, or an empty table).
 */
export type DistinctEstimate =
  | { readonly kind: 'known'; readonly value: number }
  | { readonly kind: 'undefinedDistinctness' }
  | { readonly kind: 'unknown' };

export type GroupAggregate = {
  readonly alias?: string;
  readonly column?: string;
  readonly filters?: readonly QueryFilter[];
  readonly fn: AggregateFn;
};

/**
 * `unknown` is not a number this code failed to compute — it is the catalogue having no
 * distinct estimate for at least one key, which ADR-066 answers with warn-and-proceed plus
 * the row-limit backstop rather than a refusal.
 * Refusing would leave grouping dead on a freshly restored database, where nothing has
 * been analysed yet.
 */
export type GroupCardinalityEstimate =
  | { readonly columns: readonly string[]; readonly kind: 'unknown' }
  | { readonly kind: 'known'; readonly rows: number };

export type GroupCardinalityWarning =
  | { readonly columns: readonly string[]; readonly kind: 'stats-unavailable' }
  | {
      readonly estimatedRows: number;
      readonly kind: 'estimate-above-warn-threshold';
    };

export type GroupGuardRails = {
  readonly estimate: GroupCardinalityEstimate;
  readonly rowLimit: GroupRowLimit;
  readonly warning?: GroupCardinalityWarning;
};

/**
 * Anything that indents by path length holds for `flat` and `rollup` and must not assume
 * it here — ADR-065's amendment puts a cube result in the flat form, each row carrying its
 * own coordinates.
 * The expander map is closed over this union, which is what made cube arrive as a real
 * expansion rather than another entry: its sets are not prefixes.
 */
export type GroupingMode = 'cube' | 'flat' | 'rollup';

/**
 * Distinguishable on purpose: grouping by a primary key is the likeliest user mistake and
 * deserves its own message.
 */
/**
 * The granularity a date or timestamp group key is truncated to.
 * **An alias, not a second declaration.** The vocabulary is wire vocabulary — it travels
 * in the grouping param and again in the drill param — so it belongs to `@lcabrera/api`,
 * which this package already declares a dependency on (ADR-082).
 */
export type GroupKeyPeriod = OlapGroupPeriod;

export type GroupKeyRefusalReason =
  | 'no-equality-operator'
  | 'not-a-dimension'
  | 'stats-unavailable'
  | 'too-many-distinct'
  | 'unique-ish';

export type GroupQueryDescriptor = {
  readonly aggregates: readonly GroupAggregate[];
  /**
   * **Required**, unlike `SelectQueryDescriptor` where it is opt-in: every group
   * key is request-derived by construction, so opt-in semantics would be a
   * silent hole (ADR-059).
   */
  readonly allowedColumns: readonly string[];
  /**
   * What each column may do, as `getColumnGroupingCapabilities` resolved it from
   * the catalogue. Passed in rather than re-derived so this builder stays pure
   * while still enforcing ADR-058 — the impure half answers "what is legal
   * here", the builder refuses everything else.
   */
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly filters?: readonly QueryFilter[];
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
  /** A safety belt, not a page — a grouped read is never paginated (ADR-059). */
  readonly maxRows: number;
  /**
   * The granularity to truncate a temporal key to, by column — a map beside the key list
   * rather than a member of it.
   * A key list of records would carry the granularity inside each key, and was rejected:
   * `keys` is `readonly string[]` on both sides of the boundary, in the URL, in every group
   * path and in the expansion store, so changing its element type moves a shape that six
   * unrelated things already agree on.
   */
  readonly periods?: Readonly<Record<string, GroupKeyPeriod>>;
  readonly schema: string;
  readonly sort?: readonly GroupSort[];
  readonly subtotalPlacement?: 'first' | 'last';
  readonly table: string;
};

/**
 * `backstopAt` is set only when the guard's own ceiling is the binding one — a result that
 * long is then a refusal rather than a truncation, because it proves the read blew past
 * the budget the missing statistics could not predict.
 */
export type GroupRowLimit = {
  readonly backstopAt?: number;
  readonly limit: number;
};

/**
 * A sort on an aggregate acts at the **innermost** level: its term is emitted after the
 * innermost key's `GROUPING` term and ahead of that key's own value term, which stays last
 * as the tiebreak.
 * The refusal replaced an earlier behaviour that silently moved such a sort behind every
 * key term, where it can never fire: within one grouping set the key columns already
 * identify the row, so the sort was accepted, emitted and dead.
 */
export type GroupSort =
  | { readonly aggregateAlias: string; readonly direction: 'asc' | 'desc' }
  | { readonly direction: 'asc' | 'desc'; readonly key: string };

type ColumnCapabilityShared = {
  readonly aggregates: readonly AggregateFn[];
  readonly column: string;
  readonly distinctEstimate?: number;
  /**
   * Independent of `canGroup`, and that is the point: a date column is normally refused as a
   * raw key — one group per calendar day — while `month` and above clear the same guard
   * comfortably.
   * So a refused column can still carry a non-empty list, and a surface that reads
   * `canGroup` alone would hide the one dimension every report is organised by (#786).
   */
  readonly periods: readonly GroupKeyPeriod[];
  readonly role: ColumnAnalyticalRole;
  readonly typeName: string;
};
