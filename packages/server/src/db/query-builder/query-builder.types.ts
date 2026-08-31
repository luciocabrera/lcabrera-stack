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
  readonly allowedColumns?: readonly string[];
  readonly filters: readonly QueryFilter[];
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
};

export type InsertQueryDescriptor = {
  readonly allowedColumns?: readonly string[];
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
  readonly values: Readonly<Record<string, unknown>>;
};

export type MaxValueQueryDescriptor = {
  readonly allowedColumns?: readonly string[];
  readonly column: string;
  readonly schema: string;
  readonly table: string;
};

export type QueryCursor = {
  readonly uniqueColumn: string;
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
  readonly allowedColumns?: readonly string[];
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
  readonly allowedColumns?: readonly string[];
  readonly filters: readonly QueryFilter[];
  readonly returning?: readonly string[];
  readonly schema: string;
  readonly table: string;
  readonly values: Readonly<Record<string, unknown>>;
};
