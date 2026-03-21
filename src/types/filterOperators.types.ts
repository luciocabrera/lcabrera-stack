/**
 * Boolean column filter
 */
export type BooleanFilter = {
  type: 'boolean';
  // eslint-disable-next-line @typescript-eslint/naming-convention
  value: boolean;
};

/**
 * Union type for all filter types based on column data type
 */
export type ColumnFilter =
  | BooleanFilter
  | DateFilter
  | NumberFilter
  | SelectFilter
  | TextFilter;

/**
 * Date column filter
 */
export type DateFilter = {
  operator: 'after' | 'before' | 'between' | 'equals';
  type: 'date';
  /** ISO date string */
  value: string;
  /** Second date for 'between' operator (ISO string) */
  value2?: string;
};

export type DateOperatorType = DateFilter['operator'];

/**
 * Number/currency column filter
 */
export type NumberFilter = {
  operator:
    | 'between'
    | 'equals'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'notEquals';
  type: 'number';
  value: number;
  /** Second value for 'between' operator */
  value2?: number;
};

export type NumberOperatorType = NumberFilter['operator'];

export type OperatorOption<T extends string = string> = {
  label: string;
  value: T;
};
export type OperatorType =
  | DateOperatorType
  | NumberOperatorType
  | TextOperatorType;
/**
 * Select/multi-select column filter
 */
export type SelectFilter = {
  /** Operator for select filter (defaults to 'equals' if not specified) */
  readonly operator?: 'equals' | 'notEquals';
  readonly type: 'multiSelect' | 'select';
  /** Single value for 'select' type */
  readonly value?: string;
  /** Multiple values for 'multiSelect' type */
  readonly values?: string[];
};

/**
 * Text/string column filter
 */
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

export type TextOperatorType = TextFilter['operator'];
