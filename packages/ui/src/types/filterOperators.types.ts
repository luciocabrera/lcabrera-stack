/**
 * Declared here rather than imported from `@lcabrera/server/filters/filters.types`. That
 * import resolved only through a tsconfig `paths` alias — `@lcabrera/ui` must not depend
 * on `@lcabrera/server` (ADR-039). Duplication is structural: a filter built here is
 * assignable there with no adapter, and neither package knows the other exists.
 * This union is the editing contract (a filter the user is still typing), not the query
 * one — that is why `NumberFilter.value` is `number | undefined`.
 */

export type BooleanFilter = {
  readonly type: 'boolean';
  readonly value: boolean;
};

export type ColumnFilter =
  | BooleanFilter
  | DateFilter
  | EmptyFilter
  | NumberFilter
  | SelectFilter
  | TextFilter;

export type DateFilter = {
  readonly operator: 'after' | 'before' | 'between' | 'equals';
  readonly type: 'date';
  readonly value: string;
  readonly value2?: string;
};

export type DateOperatorType = DateFilter['operator'];

export type EmptyFilter = {
  readonly operator: 'isEmpty' | 'isNotEmpty';
  readonly type: 'empty';
};

export type EmptyOperatorType = EmptyFilter['operator'];

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
  /** Undefined while the user is drafting; the editing contract, not the query one. */
  readonly value: number | undefined;
  readonly value2?: number;
};

export type NumberOperatorType = NumberFilter['operator'];

export type OperatorOption<T extends string = string> = {
  readonly label: string;
  readonly value: T;
};

export type OperatorType =
  | DateOperatorType
  | EmptyOperatorType
  | NumberOperatorType
  | TextOperatorType;

export type SelectFilter = {
  /** Defaults to `'equals'`. */
  readonly operator?: 'equals' | 'notEquals';
  readonly type: 'multiSelect' | 'select';
  /** Single value for `'select'`. */
  readonly value?: string;
  /** Multiple values for `'multiSelect'`. */
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

export type TextOperatorType = TextFilter['operator'];
