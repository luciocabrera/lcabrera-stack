import type { OlapGroupPeriod } from '@lcabrera/api/olap/olap.types';

import type { QueryFilter } from '../query-builder/query-builder.types.ts';

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

export type BuiltGroupAggregate = {
  readonly alias: string;
  readonly column?: string;
  readonly fn: AggregateFn;
};

export type BuiltGroupQuery = {
  readonly aggregates: readonly BuiltGroupAggregate[];
  /** Bit `keys.length - 1 - i` is 1 when `keys[i]` was rolled up in that set. */
  readonly groupingSetMasks: readonly number[];
  readonly guardRails: GroupGuardRails;
  /** Ordered; the mask bit positions are relative to this. */
  readonly keys: readonly string[];
  readonly maskAlias: 'group_mask';
  readonly text: string;
  readonly values: readonly unknown[];
};

export type ColumnAnalyticalRole = 'dimension' | 'fact' | 'unsupported';

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
  readonly column?: string;
  readonly filters?: readonly QueryFilter[];
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
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly filters?: readonly QueryFilter[];
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
  /** A safety belt, not a page: a grouped read is never paginated. */
  readonly maxRows: number;
  readonly periods?: Readonly<Record<string, GroupKeyPeriod>>;
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
  | { readonly direction: 'asc' | 'desc'; readonly key: string };

type ColumnCapabilityShared = {
  readonly aggregates: readonly AggregateFn[];
  readonly column: string;
  readonly distinctEstimate?: number;
  readonly periods: readonly GroupKeyPeriod[];
  readonly role: ColumnAnalyticalRole;
  readonly typeName: string;
};
