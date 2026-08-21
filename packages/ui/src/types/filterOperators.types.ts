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

export type DateOperatorType = DateFilter['operator'];

/**
 * Selects the rows where a column **holds no value** — the one filter that
 * takes no value of its own.
 *
 * **It is its own `type`, not an operator on the value-carrying filters.**
 * Emptiness is not a comparison: adding `isEmpty` to `TextFilter` and its
 * siblings would put a `value` on every such filter that must then be ignored,
 * and force each editor to hide its own input. One value-less member keeps
 * "carries a value" true of every other member of the union, and gives
 * `toQueryFilters` a single arm to dispatch.
 *
 * **Empty means SQL NULL, and deliberately not the empty string.** A text
 * column can hold both and they are different facts — `''` is a value someone
 * stored. Folding them together would need a second clause per filter, and
 * would quietly answer a different question than the one the label asks. A
 * column where `''` is meaningful wants a `TextFilter` with `equals ''`.
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
  | EmptyOperatorType
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
