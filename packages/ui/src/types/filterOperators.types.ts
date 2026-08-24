/**
 * That import resolved only through a tsconfig `paths` alias — `@lcabrera/ui` does not and
 * must not depend on `@lcabrera/server`, a Node-only package whose dependency graph pulls
 * in the Postgres driver.
 * A published `@lcabrera/ui` would have emitted declarations referencing a specifier its
 * consumers cannot resolve.
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

/**
 * **Empty means SQL NULL, and deliberately not the empty string.** A text column can hold
 * both and they are different facts — `''` is a value someone stored.
 */
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

export type TextOperatorType = TextFilter['operator'];
