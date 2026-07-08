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
