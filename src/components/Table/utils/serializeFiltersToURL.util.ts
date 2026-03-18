import type { ColumnFilter } from '@/types/filterOperators.types';

import type { ColumnFiltersState } from '../Table.types';

/** Short operator codes for URL serialization */
const OPERATOR_TO_SHORT: Record<string, string> = {
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

type CompactFilterValue = boolean | unknown[];

const serializeFilter = (filter: ColumnFilter): CompactFilterValue => {
  switch (filter.type) {
    case 'boolean': {
      return filter.value;
    }
    case 'date': {
      const op = OPERATOR_TO_SHORT[filter.operator] ?? filter.operator;
      return filter.operator === 'between' && filter.value2
        ? [op, filter.value, filter.value2]
        : [op, filter.value];
    }
    case 'multiSelect':
    case 'select': {
      const values = filter.values ?? (filter.value ? [filter.value] : []);
      return filter.operator === 'notEquals' ? ['!', ...values] : values;
    }
    case 'number': {
      const op = OPERATOR_TO_SHORT[filter.operator] ?? filter.operator;
      return filter.operator === 'between' && filter.value2 !== undefined
        ? [op, filter.value, filter.value2]
        : [op, filter.value];
    }
    case 'text': {
      const op = OPERATOR_TO_SHORT[filter.operator] ?? filter.operator;
      return [op, filter.value];
    }
  }
};

/**
 * Serialize ColumnFiltersState to a compact URL-friendly string.
 *
 * Removes redundant `type` keys and uses short operator codes.
 * Returns undefined when there are no filters.
 */
export const serializeFiltersToURL = (
  filters: ColumnFiltersState,
): string | undefined => {
  const entries = Object.entries(filters);
  if (entries.length === 0) return undefined;

  const compact = Object.fromEntries(
    entries.map(([columnKey, filter]) => [columnKey, serializeFilter(filter)]),
  );

  return JSON.stringify(compact);
};
