import type {
  DateOperatorType,
  NumberOperatorType,
  OperatorOption,
  TextOperatorType,
} from '@/types/filterOperators.types';

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
