import type {
  ColumnFilter,
  NumberOperatorType,
} from '@repo/ui/types/filterOperators.types';

import {
  DATE_OPERATOR_SHORT_CODES,
  KNOWN_OPERATOR_SHORT_CODES,
  NUMBER_OPERATOR_SHORT_CODES,
  SHORT_TO_OPERATOR,
  TEXT_OPERATOR_SHORT_CODES,
} from '@repo/ui/constants/filterOperators.constants';

const expandOperator = (short: string) => SHORT_TO_OPERATOR.get(short) ?? short;

const isDateValue = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);

const isNumberOperatorType = (
  operator: string,
): operator is NumberOperatorType =>
  [
    'equals',
    'greaterThan',
    'greaterThanOrEqual',
    'lessThan',
    'lessThanOrEqual',
    'notEquals',
  ].includes(operator);

const parseBooleanFilter = (value: unknown): ColumnFilter | undefined => {
  if (typeof value !== 'boolean') {
    return undefined;
  }

  return { type: 'boolean', value };
};

const parseNotEqualsSelectFilter = (
  arr: readonly unknown[],
): ColumnFilter | undefined => {
  if (arr[0] !== '!') {
    return undefined;
  }

  const values = arr
    .slice(1)
    .filter((item): item is string => typeof item === 'string');

  return { operator: 'notEquals', type: 'select', values };
};

const parseNumberFilter = ({
  arr,
  operator,
}: {
  readonly arr: readonly unknown[];
  readonly operator: string;
}): ColumnFilter | undefined => {
  if (
    !NUMBER_OPERATOR_SHORT_CODES.has(operator) ||
    typeof arr[1] !== 'number'
  ) {
    return undefined;
  }

  if (operator === 'bw' && typeof arr[2] === 'number') {
    return {
      operator: 'between',
      type: 'number',
      value: arr[1],
      value2: arr[2],
    };
  }

  const expandedOperator = expandOperator(operator);
  if (!isNumberOperatorType(expandedOperator)) {
    return undefined;
  }

  return {
    operator: expandedOperator,
    type: 'number',
    value: arr[1],
  };
};

const parseDateFilter = ({
  arr,
  operator,
}: {
  readonly arr: readonly unknown[];
  readonly operator: string;
}): ColumnFilter | undefined => {
  if (!DATE_OPERATOR_SHORT_CODES.has(operator) || !isDateValue(arr[1])) {
    return undefined;
  }

  if (operator === 'bw' && typeof arr[2] === 'string') {
    return {
      operator: 'between',
      type: 'date',
      value: arr[1],
      value2: arr[2],
    };
  }

  return {
    operator: expandOperator(operator) as 'after',
    type: 'date',
    value: arr[1],
  };
};

const parseTextFilter = ({
  arr,
  operator,
}: {
  readonly arr: readonly unknown[];
  readonly operator: string;
}): ColumnFilter | undefined => {
  if (!TEXT_OPERATOR_SHORT_CODES.has(operator) || typeof arr[1] !== 'string') {
    return undefined;
  }

  return {
    operator: expandOperator(operator) as 'contains',
    type: 'text',
    value: arr[1],
  };
};

const parseKnownOperatorFilter = (
  arr: readonly unknown[],
): ColumnFilter | undefined => {
  const first = arr[0];

  if (typeof first !== 'string' || !KNOWN_OPERATOR_SHORT_CODES.has(first)) {
    return undefined;
  }

  return (
    parseNumberFilter({ arr, operator: first }) ??
    parseDateFilter({ arr, operator: first }) ??
    parseTextFilter({ arr, operator: first })
  );
};

const parseEqualsSelectFilter = (
  arr: readonly unknown[],
): ColumnFilter | undefined => {
  const values = arr.filter((item): item is string => typeof item === 'string');

  if (values.length !== arr.length) {
    return undefined;
  }

  return { operator: 'equals', type: 'select', values };
};

/**
 * Deserialize a single compact filter value back to a ColumnFilter.
 *
 * Infers the filter type from the value shape and expands short operator codes.
 * Returns undefined if the value cannot be parsed.
 */
export const deserializeFilter = (value: unknown): ColumnFilter | undefined => {
  const booleanFilter = parseBooleanFilter(value);
  if (booleanFilter) {
    return booleanFilter;
  }

  if (!Array.isArray(value)) return undefined;

  const arr = value as unknown[];

  // Empty array — skip
  if (arr.length === 0) return undefined;

  return (
    parseNotEqualsSelectFilter(arr) ??
    parseKnownOperatorFilter(arr) ??
    parseEqualsSelectFilter(arr)
  );
};
