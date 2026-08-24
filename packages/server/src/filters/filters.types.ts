/**
 * Duplicated with `@lcabrera/ui` on purpose (ADR-039): structural typing is what makes it
 * work without an adapter. `NumberFilter.value` admitting `undefined` and
 * `SelectFilter.operator` being optional are laxities held for assignability from the UI's
 * drafting shape — tightening them is a behaviour change, not a type-only edit.
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

/**
 * Empty is SQL NULL and deliberately not the empty string; see the mirror of this type in
 * `@lcabrera/ui` for why.
 */
export type EmptyFilter = {
  readonly operator: 'isEmpty' | 'isNotEmpty';
  readonly type: 'empty';
};

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
