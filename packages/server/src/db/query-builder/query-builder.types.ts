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
  /** Defaults to `*`. Pass a column to skip its NULLs. */
  readonly column?: string;
  readonly filters?: readonly QueryFilter[];
  readonly schema: string;
  readonly table: string;
};

export type DeleteQueryDescriptor = {
  /** Same opt-in authorization as `SelectQueryDescriptor`. */
  readonly allowedColumns?: readonly string[];
  /** At least one is required; an unfiltered DELETE is refused. */
  readonly filters: readonly QueryFilter[];
  /** `['*']` returns the whole row and must stand alone. */
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
};

export type InsertQueryDescriptor = {
  /** Same opt-in authorization as `SelectQueryDescriptor`. */
  readonly allowedColumns?: readonly string[];
  /** `['*']` returns the whole row and must stand alone. */
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
  readonly values: Readonly<Record<string, unknown>>;
};

export type MaxValueQueryDescriptor = {
  /** Same opt-in authorization as `SelectQueryDescriptor`. */
  readonly allowedColumns?: readonly string[];
  readonly column: string;
  readonly schema: string;
  readonly table: string;
};

export type QueryCursor = {
  /** Must be the last `sort` entry. */
  readonly uniqueColumn: string;
  /** One value per `sort` entry, in `sort` order. */
  readonly values: readonly unknown[];
};

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
  /** Opt-in: when set, every fields/filter/sort column must be a member. */
  readonly allowedColumns?: readonly string[];
  /** Resumes after this row; `sort` must be a total order ending on its `uniqueColumn`. */
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

export type UnaryOperator = 'isNotNull' | 'isNull';

export type UpdateQueryDescriptor = {
  /** Same opt-in authorization as `SelectQueryDescriptor`. */
  readonly allowedColumns?: readonly string[];
  /** At least one is required; an unfiltered UPDATE is refused. */
  readonly filters: readonly QueryFilter[];
  /** `['*']` returns the whole row and must stand alone. */
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
  readonly values: Readonly<Record<string, unknown>>;
};
