import type {
  DateOperatorType,
  NumberOperatorType,
  OperatorOption,
  TextOperatorType,
} from '@/types/filterOperators.types';

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
  lessThan: 'lt',
  lessThanOrEqual: 'lte',
  notContains: 'nct',
  notEquals: 'neq',
  startsWith: 'sw',
};

/** Short code → full operator name for URL deserialization */
export const SHORT_TO_OPERATOR = new Map([
  ['af', 'after'],
  ['bf', 'before'],
  ['bw', 'between'],
  ['ct', 'contains'],
  ['eq', 'equals'],
  ['ew', 'endsWith'],
  ['gt', 'greaterThan'],
  ['gte', 'greaterThanOrEqual'],
  ['lt', 'lessThan'],
  ['lte', 'lessThanOrEqual'],
  ['nct', 'notContains'],
  ['neq', 'notEquals'],
  ['sw', 'startsWith'],
]);

export const KNOWN_OPERATOR_SHORT_CODES = new Set(SHORT_TO_OPERATOR.keys());
export const DATE_OPERATOR_SHORT_CODES = new Set(['af', 'bf', 'bw', 'eq']);
export const TEXT_OPERATOR_SHORT_CODES = new Set(['ct', 'eq', 'ew', 'nct', 'neq', 'sw']);

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
