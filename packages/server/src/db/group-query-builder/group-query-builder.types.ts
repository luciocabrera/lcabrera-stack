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
  /**
   * What the cardinality rails decided: the pre-flight bound, the `LIMIT` this
   * query actually carries, and any warning worth passing on. Emitted rather
   * than recomputed by the caller, so the number in the SQL and the number the
   * caller reasons about are the same one.
   */
  readonly guardRails: GroupGuardRails;
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
 * What a column may do in a grouped read.
 *
 * Discriminated on `canGroup` so that a refusal **must** carry its reason: the
 * UI says why rather than hiding the column, and a builder can put the reason
 * straight into an error without a fallback for a state that cannot occur.
 * `refusal?: never` on the groupable arm keeps `capability.refusal` readable
 * without narrowing first, which is what most consumers want.
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
 * The pre-flight row bound for a grouped read, computed before a single row is
 * read.
 *
 * `unknown` is not a number this code failed to compute — it is the catalogue
 * having no distinct estimate for at least one key, which ADR-066 answers with
 * warn-and-proceed plus the row-limit backstop rather than a refusal. Refusing
 * would leave grouping dead on a freshly restored database, where nothing has
 * been analysed yet.
 */
export type GroupCardinalityEstimate =
  | { readonly columns: readonly string[]; readonly kind: 'unknown' }
  | { readonly kind: 'known'; readonly rows: number };

/**
 * A grouped read that ran and is worth telling the caller about. Carried beside
 * the rows rather than thrown, because the data is there and usable — the point
 * is that the operator learns why it was expensive.
 */
export type GroupCardinalityWarning =
  | { readonly columns: readonly string[]; readonly kind: 'stats-unavailable' }
  | {
      readonly estimatedRows: number;
      readonly kind: 'estimate-above-warn-threshold';
    };

/**
 * What the cardinality rails decided about a grouped read, carried on the built
 * query so the executor can act on it without re-deriving anything.
 *
 * `warning` is absent when there is nothing to say, rather than being a nullable
 * field: "no warning" and "a warning of kind none" are not two states worth
 * having.
 */
export type GroupGuardRails = {
  readonly estimate: GroupCardinalityEstimate;
  readonly rowLimit: GroupRowLimit;
  readonly warning?: GroupCardinalityWarning;
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
 * The `LIMIT` a grouped read runs under, and whether reaching it means anything.
 *
 * `backstopAt` is set only when the guard's own ceiling is the binding one — a
 * result that long is then a refusal rather than a truncation, because it proves
 * the read blew past the budget the missing statistics could not predict. When
 * the *caller's* `maxRows` binds first there is no backstop: a caller that asked
 * for at most N rows got what it asked for.
 */
export type GroupRowLimit = {
  readonly backstopAt?: number;
  readonly limit: number;
};

/**
 * A sort on a group key sets that key's direction in place. A sort on an
 * aggregate acts at the **innermost** level: its term is emitted after the
 * innermost key's `GROUPING` term and ahead of that key's own value term,
 * which stays last as the tiebreak.
 *
 * **The order of this list is meaningful, and an aggregate listed ahead of a
 * key is refused at construction** (`assert-group-sort.util.ts`). Ranking
 * parents by their own totals scrambles the hierarchy, and doing it correctly
 * needs the parent's aggregate on the child row
 * (`sum(…) OVER (PARTITION BY k₁)`) — a named v2. The refusal replaced an
 * earlier behaviour that silently moved such a sort behind every key term,
 * where it can never fire: within one grouping set the key columns already
 * identify the row, so the sort was accepted, emitted and dead.
 */
export type GroupSort =
  | { readonly aggregateAlias: string; readonly direction: 'asc' | 'desc' }
  | { readonly direction: 'asc' | 'desc'; readonly key: string };

/** The half of a capability that does not depend on whether the column is groupable. */
type ColumnCapabilityShared = {
  readonly aggregates: readonly AggregateFn[];
  readonly column: string;
  /** Resolved distinct-value estimate; absent when statistics are unavailable. */
  readonly distinctEstimate?: number;
  readonly role: ColumnAnalyticalRole;
  readonly typeName: string;
};
