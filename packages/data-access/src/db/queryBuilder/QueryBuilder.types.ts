export type BuiltQuery = {
  readonly text: string;
  readonly values: readonly unknown[];
};

export type ComparisonOperator =
  | 'eq'
  | 'gt'
  | 'gte'
  | 'ilike'
  | 'in'
  | 'lt'
  | 'lte'
  | 'neq';

export type CountQueryDescriptor = {
  readonly allowedColumns?: readonly string[];
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

export type DistinctQueryDescriptor = {
  /** Same opt-in authorization semantics as SelectQueryDescriptor. */
  readonly allowedColumns?: readonly string[];
  readonly column: string;
  readonly limit?: number;
  readonly offset?: number;
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

export type QueryFilter = {
  readonly column: string;
  readonly operator: ComparisonOperator;
  readonly value: unknown;
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
  readonly fields: readonly string[];
  readonly filters?: readonly QueryFilter[];
  readonly limit?: number;
  readonly offset?: number;
  readonly schema: string;
  readonly sort?: readonly QuerySort[];
  readonly table: string;
};

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
