import type { QueryFilter } from '../query-builder/query-builder.types.ts';

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
 * One aggregate paired with the alias it is projected under. Resolved once in
 * `buildGroupQuery`, so the alias the assertions check, the alias the SQL emits
 * and the alias the caller decodes by are the same string.
 */
export type AliasedGroupAggregate = {
  readonly aggregate: GroupAggregate;
  readonly alias: string;
};

/** What `buildGroupQuery` emitted, so a caller can decode the row it gets back. */
export type BuiltGroupAggregate = {
  readonly alias: string;
  /** Absent for `count(*)`. */
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
  /** The group keys, ordered — the bit positions above are relative to this. */
  readonly keys: readonly string[];
  readonly maskAlias: 'group_mask';
  readonly text: string;
  readonly values: readonly unknown[];
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

export type GroupAggregate = {
  /**
   * Overrides the derived `${fn}_${column}` name. It is the escape hatch for
   * two aggregates that would otherwise derive the same alias, and for a column
   * name long enough to push the derived one past Postgres's identifier limit.
   */
  readonly alias?: string;
  /** Omitted only for `count`, which then becomes `count(*)`. */
  readonly column?: string;
  /**
   * Emitted as `FILTER (WHERE …)`. These values claim the leading `$n` slots,
   * because the `SELECT` list is built before the `WHERE` clause.
   */
  readonly filters?: readonly QueryFilter[];
  readonly fn: AggregateFn;
};

/**
 * `cube` is deliberately absent until #574 adds it: the expander map is closed
 * over this union, so widening it is a compile error until the expansion exists.
 */
export type GroupingMode = 'flat' | 'rollup';

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
  /** Ordered, and the order is the tree's nesting order. */
  readonly keys: readonly string[];
  /** A safety belt, not a page — a grouped read is never paginated (ADR-059). */
  readonly maxRows: number;
  readonly schema: string;
  readonly sort?: readonly GroupSort[];
  /** Where a subtotal sits relative to the rows it totals. Defaults to `last`. */
  readonly subtotalPlacement?: 'first' | 'last';
  readonly table: string;
};

/**
 * A sort on a group key sets that key's direction in place; a sort on an
 * aggregate is appended after every key term. That ordering is structural, not
 * a convention: it is what makes ranking an ancestor by an aggregate
 * inexpressible, which is the thing that would scramble the hierarchy.
 */
export type GroupSort =
  | { readonly aggregateAlias: string; readonly direction: 'asc' | 'desc' }
  | { readonly direction: 'asc' | 'desc'; readonly key: string };
