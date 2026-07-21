/**
 * Column-filter types for the Table filter UI.
 *
 * These shapes are declared here rather than imported from
 * `@lcabrera/server/filters/filters.types`, which is where they used to live. That
 * import resolved only through a tsconfig `paths` alias — `@lcabrera/ui` does not
 * and must not depend on `@lcabrera/server`, a Node-only package whose dependency
 * graph pulls in the Postgres driver. A published `@lcabrera/ui` would have emitted
 * declarations referencing a specifier its consumers cannot resolve.
 *
 * `@lcabrera/server` declares the same shapes independently for
 * `toQueryFilters`'s input. That is duplication on purpose: TypeScript is
 * structural, so a filter built here is assignable there with no adapter, and
 * neither package has to know the other exists. The two definitions are held in
 * step by a conformance test in the app that uses both — see
 * `apps/react-router/src/routes/enterprise-orders/filterContract.test.ts`.
 *
 * They are also not quite the same contract, which is the deeper reason to split
 * them. This one models a filter the user is *editing* — `NumberFilter.value`
 * is `undefined` mid-typing and `SelectFilter.operator` may be omitted — while
 * the query layer's models what can be turned into SQL. Sharing one type forced
 * drafting states into a server-side contract.
 */

export type BooleanFilter = {
  readonly type: 'boolean';
  readonly value: boolean;
};

export type ColumnFilter =
  | BooleanFilter
  | DateFilter
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

export type DateOperatorType = DateFilter['operator'];

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

export type TextOperatorType = TextFilter['operator'];
