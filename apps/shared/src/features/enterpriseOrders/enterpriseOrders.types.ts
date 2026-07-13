import type { DbRow, PaginatedResponse } from '../../types/api.types.js';

export type BooleanFilter = {
  readonly type: 'boolean';
  readonly value: boolean;
};

export type DateFilter = {
  readonly operator: 'after' | 'before' | 'between' | 'equals';
  readonly type: 'date';
  readonly value: string;
  readonly value2?: string;
};

export type EnterpriseOrderDetailResponse = {
  readonly data: DbRow;
};

export type EnterpriseOrdersFilter =
  | BooleanFilter
  | DateFilter
  | NumberFilter
  | SelectFilter
  | TextFilter;

export type EnterpriseOrdersFilters = Readonly<
  Record<string, EnterpriseOrdersFilter>
>;

export type EnterpriseOrdersResponse = PaginatedResponse<DbRow>;

export type NumberFilter = {
  readonly operator:
    | 'between'
    | 'equals'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'notEquals';
  readonly type: 'number';
  readonly value: number;
  readonly value2?: number;
};

export type SelectFilter = {
  readonly operator?: 'equals' | 'notEquals';
  readonly type: 'multiSelect' | 'select';
  readonly value?: string;
  readonly values?: readonly string[];
};

export type TextFilter = {
  readonly operator:
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notContains'
    | 'notEquals'
    | 'startsWith';
  readonly type: 'text';
  readonly value: string;
};
