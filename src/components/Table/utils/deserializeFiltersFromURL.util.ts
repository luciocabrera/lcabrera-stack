import type { ColumnFilter } from '@/types/filterOperators.types';

import type { ColumnFiltersState } from '../Table.types';

/** Short code → full operator name */
const SHORT_TO_OPERATOR = new Map([
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

const KNOWN_OPERATORS = new Set(SHORT_TO_OPERATOR.keys());

const DATE_OPERATORS = new Set(['af', 'bf', 'bw', 'eq']);
const TEXT_OPERATORS = new Set(['ct', 'eq', 'ew', 'nct', 'neq', 'sw']);
const isDateValue = (v: unknown): boolean =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);

const expandOperator = (short: string): string =>
  SHORT_TO_OPERATOR.get(short) ?? short;

const deserializeFilter = (value: unknown): ColumnFilter | undefined => {
  // Boolean: bare true/false
  if (typeof value === 'boolean') {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    return { type: 'boolean', value };
  }

  if (!Array.isArray(value)) return undefined;

  const arr = value as unknown[];

  // Empty array — skip
  if (arr.length === 0) return undefined;

  const first = arr[0];

  // Select notEquals: ["!", "Low", ...]
  if (first === '!') {
    const values = arr.slice(1) as string[];
    return { operator: 'notEquals', type: 'select', values };
  }

  // If first element is a known operator code → typed filter
  if (typeof first === 'string' && KNOWN_OPERATORS.has(first)) {
    const op = expandOperator(first);

    // Number filter: operator + numeric value(s)
    if (typeof arr[1] === 'number') {
      return first === 'bw'
        ? {
            operator: op as 'between',
            type: 'number',
            value: arr[1],
            value2: arr[2] as number,
          }
        : {
            operator: op as 'equals',
            type: 'number',
            value: arr[1],
          };
    }

    // Date filter: date operators + date-like string
    if (DATE_OPERATORS.has(first) && isDateValue(arr[1])) {
      return first === 'bw'
        ? {
            operator: 'between',
            type: 'date',
            value: arr[1] as string,
            value2: arr[2] as string,
          }
        : {
            operator: op as 'after',
            type: 'date',
            value: arr[1] as string,
          };
    }

    // Text filter: text operators + string value
    if (TEXT_OPERATORS.has(first) && typeof arr[1] === 'string') {
      return {
        operator: op as 'contains',
        type: 'text',
        value: arr[1],
      };
    }
  }

  // Plain string array → select equals
  if (arr.every((item) => typeof item === 'string')) {
    return { operator: 'equals', type: 'select', values: arr };
  }

  return undefined;
};

/**
 * Deserialize a compact filters URL param back to ColumnFiltersState.
 *
 * Infers filter types from value shapes and expands short operator codes.
 */
export const deserializeFiltersFromURL = <TData>(
  param: string,
): ColumnFiltersState<TData> => {
  try {
    const parsed = JSON.parse(param) as Record<string, unknown>;

    const result = Object.fromEntries(
      Object.entries(parsed)
        .map(([columnKey, value]) => [columnKey, deserializeFilter(value)] as const)
        .filter((entry): entry is [string, ColumnFilter] => entry[1] !== undefined),
    );

    return result as ColumnFiltersState<TData>;
  } catch {
    return {} as ColumnFiltersState<TData>;
  }
};
