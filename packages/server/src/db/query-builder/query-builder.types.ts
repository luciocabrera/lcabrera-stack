export type BinaryOperator =
  | 'eq'
  | 'gt'
  | 'gte'
  | 'ilike'
  | 'in'
  | 'lt'
  | 'lte'
  | 'neq'
  | 'notIlike';

export type BuiltQuery = {
  readonly text: string;
  readonly values: readonly unknown[];
};

export type ColumnType = 'boolean' | 'date' | 'enum' | 'number' | 'text';

export type ComparisonOperator = BinaryOperator | UnaryOperator;

export type CountQueryDescriptor = {
  readonly allowedColumns?: readonly string[];
  readonly column?: string;
  readonly filters?: readonly QueryFilter[];
  readonly schema: string;
  readonly table: string;
};

export type DeleteQueryDescriptor = {
  /** Same opt-in authorization semantics as `SelectQueryDescriptor`. */
  readonly allowedColumns?: readonly string[];
  readonly filters: readonly QueryFilter[];
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
};

export type InsertQueryDescriptor = {
  /** Same opt-in authorization semantics as `SelectQueryDescriptor`. */
  readonly allowedColumns?: readonly string[];
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
  readonly values: Readonly<Record<string, unknown>>;
};

export type MaxValueQueryDescriptor = {
  /** Same opt-in authorization semantics as `SelectQueryDescriptor`. */
  readonly allowedColumns?: readonly string[];
  readonly column: string;
  readonly schema: string;
  readonly table: string;
};

/**
 * A keyset ("seek") cursor: the sort-key tuple of the last row of the previous page.
 * Passed to `buildSelectQuery` instead of `offset`, it resumes strictly after that row in
 * O(limit) rather than walking and discarding `offset` rows (ADR-052).
 */
export type QueryCursor = {
  readonly uniqueColumn: string;
  readonly values: readonly unknown[];
};

/**
 * The null tests are unary rather than `eq`/`neq` against `null` because SQL three-valued
 * logic makes those two spellings mean different things: `col = NULL` is never true, not
 * even for a NULL row.
 */
export type QueryFilter =
  | {
      readonly column: string;
      readonly operator: BinaryOperator;
      readonly value: unknown;
    }
  | {
      readonly column: string;
      readonly operator: UnaryOperator;
    };

export type QuerySort = {
  readonly column: string;
  readonly direction: 'asc' | 'desc';
};

export type SelectQueryDescriptor = {
  /**
   * Opt-in authorization: when provided, every fields/filter/sort column must be a member,
   * in addition to the always-on `assertSafeIdentifier` syntax check. Omit when every
   * column is developer-hardcoded, never derived from a request.
   */
  readonly allowedColumns?: readonly string[];
  /**
   * Keyset pagination: resume strictly after the row this cursor describes, instead of
   * counting past `offset` rows.
   * Requires `sort` to be a total order ending on `cursor.uniqueColumn`; see `QueryCursor`
   * and ADR-052.
   */
  readonly cursor?: QueryCursor;
  readonly distinct?: boolean;
  readonly fields: readonly string[];
  readonly filters?: readonly QueryFilter[];
  readonly limit?: number;
  readonly offset?: number;
  readonly schema: string;
  readonly sort?: readonly QuerySort[];
  readonly table: string;
};

/**
 * Both null tests are here so the vocabulary is closed under negation — `isNotNull`
 * without `isNull` leaves "this group's key is NULL" inexpressible, which is exactly the
 * restriction a NULL group row drills into (ADR-079).
 */
export type UnaryOperator = 'isNotNull' | 'isNull';

export type UpdateQueryDescriptor = {
  /** Same opt-in authorization semantics as `SelectQueryDescriptor`. */
  readonly allowedColumns?: readonly string[];
  readonly filters: readonly QueryFilter[];
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
  readonly values: Readonly<Record<string, unknown>>;
};
