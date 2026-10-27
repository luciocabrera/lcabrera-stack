/**
 * The column-filter shapes a paginated read carries in its `filter` param. They are also
 * what a query layer maps to clauses, so the client that serialises a filter and the server
 * that reads it back share this one declaration. `NumberFilter.value` admits `undefined` and
 * `SelectFilter.operator` is optional because a filter still being edited has that shape.
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

export type ColumnFilters = Readonly<Record<string, ColumnFilter>>;

export type ColumnFiltersParse =
  | ColumnFiltersRefusal
  | { readonly filters: ColumnFilters; readonly kind: 'parsed' };

export type ColumnFiltersRefusal =
  | {
      readonly column: string;
      readonly kind: 'refused';
      readonly reason: 'invalid-filter';
    }
  | { readonly kind: 'refused'; readonly reason: 'unreadable' };

export type DateFilter = {
  readonly operator: 'after' | 'before' | 'between' | 'equals';
  readonly type: 'date';
  /** ISO date string. */
  readonly value: string;
  readonly value2?: string;
};

export type EmptyFilter = {
  readonly operator: 'isEmpty' | 'isNotEmpty';
  readonly type: 'empty';
};

export type FilterOperatorSet<TOperator extends string> = Readonly<
  Record<TOperator, true>
>;

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
  /** Absent from the serialised form while the value is still being typed. */
  readonly value: number | undefined;
  readonly value2?: number;
};

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
