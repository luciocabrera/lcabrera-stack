/**
 * The aggregate vocabulary a grouped read may request. `countDistinct` is a
 * separate member rather than a flag because it is the one that costs a
 * per-group tuplesort.
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
 * Gate 1 of ADR-058. A dimension is what you group by (a country, a city, a
 * category); a fact is what you aggregate (an amount, a quantity, a price).
 * Anything else is out of both — including types Postgres would happily group,
 * such as `jsonb`.
 */
export type ColumnAnalyticalRole = 'dimension' | 'fact' | 'unsupported';

export type ColumnCapabilitiesQueryDescriptor = {
  readonly columns: readonly string[];
  readonly schema: string;
  readonly table: string;
};

/** One column's row from `buildColumnCapabilitiesQuery`, as `pg` returns it. */
export type ColumnCapabilityRow = {
  /** SQL aggregate names that exist for this column's type. */
  readonly aggregates: readonly string[];
  readonly column: string;
  /** Whether the type resolves a default btree/hash equality operator. */
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
  readonly typeCategory: string;
  readonly typeName: string;
  /**
   * The schema the *type* lives in, not the table. Load-bearing for the named
   * identifier exception: type names are per-schema, so a user-defined
   * `app.uuid` reports `typname = 'uuid'` exactly like `pg_catalog.uuid` does,
   * and only the namespace tells them apart.
   */
  readonly typeNamespace: string;
};

/**
 * What a column may do in a grouped read. `refusal` is present exactly when
 * `canGroup` is false, so the UI can say why rather than hiding the column.
 */
export type ColumnGroupingCapability = {
  readonly aggregates: readonly AggregateFn[];
  readonly canGroup: boolean;
  readonly column: string;
  /** Resolved distinct-value estimate; absent when statistics are unavailable. */
  readonly distinctEstimate?: number;
  readonly refusal?: GroupKeyRefusalReason;
  readonly role: ColumnAnalyticalRole;
  readonly typeName: string;
};

/**
 * `undefinedDistinctness` is `n_distinct = 0` — Postgres stating the type has no
 * equality operator, which ADR-058 forbids reading as `unknown`. `unknown` is
 * the genuinely absent case (no `pg_stats` row, or an empty table).
 */
export type DistinctEstimate =
  | { readonly kind: 'known'; readonly value: number }
  | { readonly kind: 'undefinedDistinctness' }
  | { readonly kind: 'unknown' };

/**
 * Why a column may not be a group key. Distinguishable on purpose: grouping by a
 * primary key is the likeliest user mistake and deserves its own message.
 */
export type GroupKeyRefusalReason =
  | 'no-equality-operator'
  | 'not-a-dimension'
  | 'stats-unavailable'
  | 'too-many-distinct'
  | 'unique-ish';
