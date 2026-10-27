import type {
  BuiltGroupQuery,
  GroupQueryDescriptor,
} from '../group-query-builder/group-query-builder.types.ts';

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

export type BuiltReadQuery<TDescriptor extends ReadQueryDescriptor> =
  TDescriptor extends GroupedReadQueryDescriptor ? BuiltGroupQuery : BuiltQuery;

export type ColumnReference = JoinedColumnReference | string;

export type ColumnType = 'boolean' | 'date' | 'enum' | 'number' | 'text';

export type ComparisonOperator = BinaryOperator | UnaryOperator;

export type CountQueryDescriptor = {
  /** Opt-in on a single-target read; required once `joins` is non-empty. */
  readonly allowedColumns?: readonly string[];
  /** Defaults to `*`. Pass a column to skip its NULLs. */
  readonly column?: ColumnReference;
  readonly filters?: readonly QueryFilter<ColumnReference>[];
  readonly joins?: readonly ReadJoin[];
  /** Required once `joins` is non-empty; resolve it with `getForeignKeyRelations`. */
  readonly relations?: readonly ForeignKeyRelation[];
  readonly schema: string;
  readonly table: string;
};

export type CountReadQueryDescriptor = CountQueryDescriptor & {
  readonly aggregates?: never;
  readonly capabilities?: never;
  readonly columnAxis?: never;
  readonly count: true;
  readonly cursor?: never;
  readonly distinct?: never;
  readonly fields?: never;
  readonly groupFilters?: never;
  readonly grouping?: never;
  readonly keys?: never;
  readonly limit?: never;
  readonly maxRows?: never;
  readonly offset?: never;
  readonly periods?: never;
  readonly sort?: never;
  readonly subtotalPlacement?: never;
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

export type ForeignKeyRelation = {
  /** The referencing columns, in constraint order. */
  readonly columns: readonly string[];
  /** Paired one for one with `columns`. */
  readonly referencedColumns: readonly string[];
  readonly referencedSchema: string;
  readonly referencedTable: string;
  readonly schema: string;
  readonly table: string;
};

export type GroupedReadQueryDescriptor = GroupQueryDescriptor & {
  readonly column?: never;
  readonly count?: never;
  readonly cursor?: never;
  readonly distinct?: never;
  readonly fields?: never;
  readonly limit?: never;
  readonly offset?: never;
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

export type JoinedColumnReference = {
  readonly column: string;
  /** The `alias` of one of the read's `joins`. */
  readonly source: string;
};

export type JoinKind = 'inner' | 'left';

export type MaxValueQueryDescriptor = {
  /** Same opt-in authorization as `SelectQueryDescriptor`. */
  readonly allowedColumns?: readonly string[];
  readonly column: string;
  readonly schema: string;
  readonly table: string;
};

export type QueryCursor = {
  /** Must be the last `sort` entry, and a base-target column. */
  readonly uniqueColumn: string;
  /** One value per `sort` entry, in `sort` order. */
  readonly values: readonly unknown[];
};

export type QueryFilter<TColumn extends ColumnReference = string> =
  | {
      readonly column: TColumn;
      readonly operator: BinaryOperator;
      readonly value: unknown;
    }
  | {
      readonly column: TColumn;
      readonly operator: UnaryOperator;
    };

export type QuerySort<TColumn extends ColumnReference = string> = {
  readonly column: TColumn;
  readonly direction: 'asc' | 'desc';
};

export type ReadJoin = {
  readonly alias: string;
  /** Every column the read may name on this join's target. */
  readonly allowedColumns: readonly string[];
  /** The referencing columns of a foreign key declared on `source`. */
  readonly foreignKey: readonly string[];
  readonly kind: JoinKind;
  /** An earlier join's `alias`; omit to join from the base target. */
  readonly source?: string;
};

export type ReadQueryDescriptor =
  | CountReadQueryDescriptor
  | GroupedReadQueryDescriptor
  | RowsReadQueryDescriptor;

export type ReadScope = {
  readonly base: ReadScopeSource;
  /** The whole `FROM` list: the base target followed by every join clause. */
  readonly from: string;
  readonly joins: ReadonlyMap<string, ReadScopeSource>;
};

export type ReadScopeSource = {
  readonly allowedColumns: readonly string[];
  readonly qualifier: string;
  readonly schema: string;
  readonly table: string;
};

export type RowsReadQueryDescriptor = SelectQueryDescriptor & {
  readonly aggregates?: never;
  readonly capabilities?: never;
  readonly column?: never;
  readonly columnAxis?: never;
  readonly count?: never;
  readonly groupFilters?: never;
  readonly grouping?: never;
  readonly keys?: never;
  readonly maxRows?: never;
  readonly periods?: never;
  readonly subtotalPlacement?: never;
};

export type SelectQueryDescriptor = {
  /** Opt-in: every fields/filter/sort column must be a member. Omit only if no column is request-derived. Required once `joins` is non-empty. */
  readonly allowedColumns?: readonly string[];
  /** Resumes after this row; `sort` must be a total order ending on its `uniqueColumn`. */
  readonly cursor?: QueryCursor;
  readonly distinct?: boolean;
  /** A joined column comes back as `<alias>.<column>`. */
  readonly fields: readonly ColumnReference[];
  readonly filters?: readonly QueryFilter<ColumnReference>[];
  readonly joins?: readonly ReadJoin[];
  readonly limit?: number;
  readonly offset?: number;
  /** Required once `joins` is non-empty; resolve it with `getForeignKeyRelations`. */
  readonly relations?: readonly ForeignKeyRelation[];
  readonly schema: string;
  readonly sort?: readonly QuerySort<ColumnReference>[];
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
