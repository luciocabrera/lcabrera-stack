import type { OlapGroupPeriod } from '@lcabrera/api/olap/olap.types';

import type {
  BinaryOperator,
  ColumnReference,
  ForeignKeyRelation,
  QueryFilter,
  ReadJoin,
  UnaryOperator,
} from '../query-builder/query-builder.types.ts';

export type AggregateFn =
  | 'avg'
  | 'boolAnd'
  | 'boolOr'
  | 'count'
  | 'countDistinct'
  | 'max'
  | 'min'
  | 'sum';

export type AggregateSpec = {
  readonly distinct: boolean;
  readonly sql: string;
};

export type AliasedGroupAggregate = {
  readonly aggregate: GroupAggregate;
  readonly alias: string;
};

export type BuiltColumnAxis = {
  readonly key: string;
  readonly values: readonly unknown[];
};

export type BuiltGroupAggregate = {
  readonly alias: string;
  /** Present when this aggregate is one value of a column axis. `value` is undefined for SQL NULL. */
  readonly axis?: { readonly value: unknown };
  readonly column?: string;
  readonly fn: AggregateFn;
};

export type BuiltGroupQuery = {
  readonly aggregates: readonly BuiltGroupAggregate[];
  readonly columnAxis?: BuiltColumnAxis;
  /** A GROUPING() value per emitted set, in emission order; bit `keys.length - 1 - i` is 1 when `keys[i]` rolled up. */
  readonly groupingSetMasks: readonly number[];
  readonly guardRails: GroupGuardRails;
  /** Ordered; the mask bit positions are relative to this. */
  readonly keys: readonly string[];
  readonly maskAlias: 'group_mask';
  readonly text: string;
  readonly values: readonly unknown[];
};

export type ColumnAnalyticalRole = 'dimension' | 'fact' | 'unsupported';

export type ColumnAxis = {
  readonly key: ColumnReference;
  /** Caller-supplied ceiling on distinct axis values; the package does not invent one. */
  readonly maxDistinct: number;
  readonly values: readonly unknown[];
};

export type ColumnAxisRequest = {
  readonly key: ColumnReference;
  readonly maxDistinct: number;
};

export type ColumnCapabilitiesQueryDescriptor = {
  readonly columns: readonly string[];
  readonly schema: string;
  readonly table: string;
};

export type ColumnCapabilityRow = {
  readonly aggregates: readonly string[];
  readonly column: string;
  readonly hasEquality: boolean;
  readonly hasStats: boolean;
  readonly nDistinct: number;
  readonly relTuples: number;
  readonly spanDays?: number;
  readonly typeCategory: string;
  readonly typeName: string;
  readonly typeNamespace: string;
};

export type ColumnGroupingCapability =
  | (ColumnCapabilityShared & {
      readonly canGroup: false;
      readonly refusal: GroupKeyRefusalReason;
    })
  | (ColumnCapabilityShared & {
      readonly canGroup: true;
      readonly refusal?: never;
    });

export type DistinctEstimate =
  | { readonly kind: 'known'; readonly value: number }
  | { readonly kind: 'undefinedDistinctness' }
  | { readonly kind: 'unknown' };

export type GroupAggregate = {
  readonly alias?: string;
  readonly column?: ColumnReference;
  readonly filters?: readonly QueryFilter<ColumnReference>[];
  readonly fn: AggregateFn;
};

export type GroupCardinalityEstimate =
  | { readonly columns: readonly string[]; readonly kind: 'unknown' }
  | { readonly kind: 'known'; readonly rows: number };

export type GroupCardinalityWarning =
  | { readonly columns: readonly string[]; readonly kind: 'stats-unavailable' }
  | {
      readonly estimatedRows: number;
      readonly kind: 'estimate-above-warn-threshold';
    };

export type GroupFilter =
  | {
      readonly aggregateAlias: string;
      readonly operator: GroupFilterBinaryOperator;
      readonly value: unknown;
    }
  | {
      readonly aggregateAlias: string;
      readonly operator: UnaryOperator;
    };

export type GroupFilterBinaryOperator = Exclude<
  BinaryOperator,
  'ilike' | 'notIlike'
>;

export type GroupGuardRails = {
  readonly estimate: GroupCardinalityEstimate;
  readonly rowLimit: GroupRowLimit;
  readonly warning?: GroupCardinalityWarning;
};

export type GroupingMode = 'cube' | 'flat' | 'rollup';

export type GroupKeyPeriod = OlapGroupPeriod;

export type GroupKeyRefusalReason =
  | 'no-equality-operator'
  | 'not-a-dimension'
  | 'stats-unavailable'
  | 'too-many-distinct'
  | 'unique-ish';

export type GroupQueryDescriptor = {
  readonly aggregates: readonly GroupAggregate[];
  readonly allowedColumns: readonly string[];
  /** A joined column's entry is keyed by its projected name, `<alias>.<column>`. */
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly columnAxis?: ColumnAxis;
  readonly filters?: readonly QueryFilter<ColumnReference>[];
  /** `HAVING`; accepted only with `grouping: 'flat'` and no `columnAxis`. */
  readonly groupFilters?: readonly GroupFilter[];
  readonly grouping: GroupingMode;
  readonly joins?: readonly ReadJoin[];
  readonly keys: readonly ColumnReference[];
  /** A safety belt, not a page: a grouped read is never paginated. */
  readonly maxRows: number;
  /** A joined key's entry is keyed by its projected name, `<alias>.<column>`. */
  readonly periods?: Readonly<Record<string, GroupKeyPeriod>>;
  /** Required once `joins` is non-empty; resolve it with `getForeignKeyRelations`. */
  readonly relations?: readonly ForeignKeyRelation[];
  readonly schema: string;
  readonly sort?: readonly GroupSort[];
  readonly subtotalPlacement?: 'first' | 'last';
  readonly table: string;
};

export type GroupRowLimit = {
  readonly backstopAt?: number;
  readonly limit: number;
};

export type GroupSort =
  | { readonly aggregateAlias: string; readonly direction: 'asc' | 'desc' }
  | { readonly direction: 'asc' | 'desc'; readonly key: ColumnReference };

type ColumnCapabilityShared = {
  readonly aggregates: readonly AggregateFn[];
  readonly column: string;
  readonly distinctEstimate?: number;
  readonly periods: readonly GroupKeyPeriod[];
  readonly role: ColumnAnalyticalRole;
  readonly typeName: string;
};
