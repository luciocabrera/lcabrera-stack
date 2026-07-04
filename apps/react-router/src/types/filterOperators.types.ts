/**
 * Boolean column filter
 */
export type BooleanFilter = {
  readonly type: 'boolean';
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly value: boolean;
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
  readonly operator: 'after' | 'before' | 'between' | 'equals';
  readonly type: 'date';
  /** ISO date string */
  readonly value: string;
  /** Second date for 'between' operator (ISO string) */
  readonly value2?: string;
};

export type DateOperatorType = DateFilter['operator'];

/**
 * Number/currency column filter
 */
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
  /** Undefined while the user is drafting the filter (empty input) */
  readonly value: number | undefined;
  /** Second value for 'between' operator */
  readonly value2?: number;
};

export type NumberOperatorType = NumberFilter['operator'];

export type OperatorOption<T extends string = string> = {
  readonly label: string;
  readonly value: T;
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
  readonly values?: readonly string[];
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
