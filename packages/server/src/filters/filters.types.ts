/**
 * `@lcabrera/ui` used to import these, resolving only through a tsconfig `paths` alias,
 * which made a client-safe package depend on a Node-only one whose graph includes the
 * Postgres driver — fine while both are private, unresolvable the moment `@lcabrera/ui` is
 * published.
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
