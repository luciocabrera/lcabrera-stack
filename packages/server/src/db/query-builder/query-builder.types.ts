/** Operators that compare a column against a parameterized value. */
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

/**
 * The value class of a column, used by `selectFilterOptions` to decide which
 * distinct filter values are "meaningful": only `text` columns exclude the empty
 * string (the rest have no empty-string notion, so just NULL is excluded).
 */
export type ColumnType = 'boolean' | 'date' | 'enum' | 'number' | 'text';

export type ComparisonOperator = BinaryOperator | UnaryOperator;

export type CountQueryDescriptor = {
  readonly allowedColumns?: readonly string[];
  /**
   * Column passed to `count()`; defaults to `*` (count every matching row).
   * Pass a specific column — typically the primary key — for a table with no
   * `id` column, or when NULLs in that column should not be counted.
   */
  readonly column?: string;
  readonly filters?: readonly QueryFilter[];
  readonly schema: string;
  readonly table: string;
};

export type DeleteQueryDescriptor = {
  /** Same opt-in authorization semantics as SelectQueryDescriptor. */
  readonly allowedColumns?: readonly string[];
  /** At least one filter is required — an unfiltered DELETE is refused. */
  readonly filters: readonly QueryFilter[];
  /** Columns to return from the deleted row(s); `['*']` returns the whole row. */
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
};

export type InsertQueryDescriptor = {
  /** Same opt-in authorization semantics as SelectQueryDescriptor. */
  readonly allowedColumns?: readonly string[];
  /** Columns to return from the inserted row(s); `['*']` returns the whole row. */
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
  /** Column→value map; keys become quoted identifiers, values become `$n` params. */
  readonly values: Readonly<Record<string, unknown>>;
};

export type MaxValueQueryDescriptor = {
  /** Same opt-in authorization semantics as SelectQueryDescriptor. */
  readonly allowedColumns?: readonly string[];
  readonly column: string;
  readonly schema: string;
  readonly table: string;
};

/**
 * A single WHERE condition. A `BinaryOperator` carries the value it compares
 * against; a `UnaryOperator` (`isNotNull`) stands alone and takes no value.
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
   * Opt-in authorization check: when provided, every fields/filter/sort
   * column must be a member (in addition to the always-on syntax check via
   * assertSafeIdentifier). Omit when every column is developer-hardcoded,
   * never derived from a request.
   */
  readonly allowedColumns?: readonly string[];
  /** Emit `SELECT DISTINCT` over `fields` rather than a plain `SELECT`. */
  readonly distinct?: boolean;
  readonly fields: readonly string[];
  readonly filters?: readonly QueryFilter[];
  readonly limit?: number;
  readonly offset?: number;
  readonly schema: string;
  readonly sort?: readonly QuerySort[];
  readonly table: string;
};

/** Operators that stand alone — no value, no bound parameter. */
export type UnaryOperator = 'isNotNull';

export type UpdateQueryDescriptor = {
  /** Same opt-in authorization semantics as SelectQueryDescriptor. */
  readonly allowedColumns?: readonly string[];
  /** At least one filter is required — an unfiltered UPDATE is refused. */
  readonly filters: readonly QueryFilter[];
  /** Columns to return from the updated row(s); `['*']` returns the whole row. */
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
  /** Column→value map for the SET clause; values become `$n` params. */
  readonly values: Readonly<Record<string, unknown>>;
};
