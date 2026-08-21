/**
 * The column-filter shape `toQueryFilters` accepts. Each variant is
 * discriminated by `type`; the `to*QueryFilters` mappers in this folder
 * translate one into the flat `QueryFilter[]` the query builders consume.
 *
 * `@lcabrera/ui` declares a structurally identical set for its Table filter UI.
 * That is duplication on purpose. `@lcabrera/ui` used to import these, resolving
 * only through a tsconfig `paths` alias, which made a client-safe package
 * depend on a Node-only one whose graph includes the Postgres driver — fine
 * while both are private, unresolvable the moment `@lcabrera/ui` is published.
 * Neither package now knows the other exists; TypeScript's structural typing
 * means a filter built in the UI is assignable here with no adapter, and a
 * conformance test in the app that consumes both fails if they drift.
 *
 * Two fields here are laxer than a query contract would choose on its own —
 * `NumberFilter.value` admits `undefined` and `SelectFilter.operator` is
 * optional — because they were authored for a filter the user is still editing.
 * They are kept as-is so this stays assignable from the UI's shape; tightening
 * them is a behaviour change for the mappers, not a type-only edit.
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
  /** ISO date string */
  readonly value: string;
  /** Second date for 'between' operator (ISO string) */
  readonly value2?: string;
};

/**
 * Selects the rows where a column holds no value — the one filter carrying no
 * value of its own. Translated to the unary `isNull`/`isNotNull` the query
 * builder already emits as `IS NULL`/`IS NOT NULL`, with no bound parameter.
 *
 * Empty is SQL NULL and deliberately not the empty string; see the mirror of
 * this type in `@lcabrera/ui` for why.
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
  /** Undefined while the user is drafting the filter (empty input) */
  readonly value: number | undefined;
  /** Second value for 'between' operator */
  readonly value2?: number;
};

export type SelectFilter = {
  /** Operator for select filter (defaults to 'equals' if not specified) */
  readonly operator?: 'equals' | 'notEquals';
  readonly type: 'multiSelect' | 'select';
  /** Single value for 'select' type */
  readonly value?: string;
  /** Multiple values for 'multiSelect' type */
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
