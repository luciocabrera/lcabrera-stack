import type { ColumnFilter } from '@/types/filterOperators.types';

const validateDateFilter = (
  filter: Extract<ColumnFilter, { type: 'date' }>,
) => {
  if (!filter.value) return false;
  if (filter.operator === 'between') {
    return Boolean(filter.value2);
  }
  return true;
};

const validateNumberFilter = (
  filter: Extract<ColumnFilter, { type: 'number' }>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (filter.value === undefined) return false;
  if (filter.operator === 'between') {
    return filter.value2 !== undefined && filter.value2 > filter.value;
  }
  return true;
};

const validateSelectFilter = (
  filter: Extract<ColumnFilter, { type: 'multiSelect' | 'select' }>,
) => {
  if ('values' in filter && filter.values) {
    return filter.values.length > 0;
  }
  if ('value' in filter && filter.value) {
    return true;
  }
  return false;
};

const validateTextFilter = (
  filter: Extract<ColumnFilter, { type: 'text' }>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return Boolean(filter.value?.trim());
};

/**
 * Validates a filter to ensure required fields are populated
 */
export const validateFilter = (
  filter: ColumnFilter | null | undefined,
): boolean => {
  if (!filter) return false;

  switch (filter.type) {
    case 'boolean': {
      return true;
    }
    case 'date': {
      return validateDateFilter(filter);
    }
    case 'multiSelect':
    case 'select': {
      return validateSelectFilter(filter);
    }
    case 'number': {
      return validateNumberFilter(filter);
    }
    case 'text': {
      return validateTextFilter(filter);
    }
    default: {
      return false;
    }
  }
};
