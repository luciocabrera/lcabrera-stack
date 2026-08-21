import type {
  DateOperatorType,
  EmptyOperatorType,
  NumberOperatorType,
  OperatorOption,
  TextOperatorType,
} from '#ui/types/filterOperators.types';

/** Full operator name → short code for compact URL serialization */
export const OPERATOR_TO_SHORT: Record<string, string> = {
  after: 'af',
  before: 'bf',
  between: 'bw',
  contains: 'ct',
  endsWith: 'ew',
  equals: 'eq',
  greaterThan: 'gt',
  greaterThanOrEqual: 'gte',
  isEmpty: 'ie',
  isNotEmpty: 'nie',
  lessThan: 'lt',
  lessThanOrEqual: 'lte',
  notContains: 'nct',
  notEquals: 'neq',
  startsWith: 'sw',
};

/**
 * Short code → full operator name for URL deserialization.
 *
 * The empty-operator codes live here and **deliberately not** in the per-type
 * sets below. Those gate the value-carrying parsers, which read `arr[1]` as
 * their value — admitting a value-less operator there let `parseTextFilter`
 * mint `{type: 'text', operator: 'isEmpty', value: …}`, a shape `TextFilter`
 * does not have and only survives because that parser casts its operator.
 * `parseEmptyFilter` reads them instead — but only inside the object form
 * `{ op: 'ie' }`, never as a bare array element, which is already how a select
 * filter carries a value someone typed.
 */
export const SHORT_TO_OPERATOR = new Map([
  ['af', 'after'],
  ['bf', 'before'],
  ['bw', 'between'],
  ['ct', 'contains'],
  ['eq', 'equals'],
  ['ew', 'endsWith'],
  ['gt', 'greaterThan'],
  ['gte', 'greaterThanOrEqual'],
  ['ie', 'isEmpty'],
  ['lt', 'lessThan'],
  ['lte', 'lessThanOrEqual'],
  ['nct', 'notContains'],
  ['neq', 'notEquals'],
  ['nie', 'isNotEmpty'],
  ['sw', 'startsWith'],
]);

export const KNOWN_OPERATOR_SHORT_CODES = new Set(SHORT_TO_OPERATOR.keys());
export const DATE_OPERATOR_SHORT_CODES = new Set(['af', 'bf', 'bw', 'eq']);
export const NUMBER_OPERATOR_SHORT_CODES = new Set([
  'bw',
  'eq',
  'gt',
  'gte',
  'lt',
  'lte',
  'neq',
]);
export const TEXT_OPERATOR_SHORT_CODES = new Set([
  'ct',
  'eq',
  'ew',
  'nct',
  'neq',
  'sw',
]);

export const DATE_OPERATORS: OperatorOption<DateOperatorType>[] = [
  { label: 'After', value: 'after' },
  { label: 'Before', value: 'before' },
  { label: 'Between', value: 'between' },
  { label: 'Equals', value: 'equals' },
];

export const NUMBER_OPERATORS: OperatorOption<NumberOperatorType>[] = [
  { label: 'Between', value: 'between' },
  { label: 'Equals', value: 'equals' },
  { label: 'Greater than', value: 'greaterThan' },
  { label: 'Greater than or equal', value: 'greaterThanOrEqual' },
  { label: 'Less than', value: 'lessThan' },
  { label: 'Less than or equal', value: 'lessThanOrEqual' },
  { label: 'Not equals', value: 'notEquals' },
];

export const TEXT_OPERATORS: OperatorOption<TextOperatorType>[] = [
  { label: 'Contains', value: 'contains' },
  { label: 'Does not contain', value: 'notContains' },
  { label: 'Does not equal', value: 'notEquals' },
  { label: 'Ends with', value: 'endsWith' },
  { label: 'Equals', value: 'equals' },
  { label: 'Starts with', value: 'startsWith' },
];

/**
 * Offered for every column type, because any column can hold no value — so
 * these are appended to each list below rather than being a list anyone selects
 * on its own.
 *
 * The labels say "empty" rather than "null": a person filtering a table is
 * asking which rows have nothing in this column, and `NULL` is the storage
 * answer to that question rather than the question.
 */
export const EMPTY_OPERATORS: OperatorOption<EmptyOperatorType>[] = [
  { label: 'Is empty', value: 'isEmpty' },
  { label: 'Is not empty', value: 'isNotEmpty' },
];
