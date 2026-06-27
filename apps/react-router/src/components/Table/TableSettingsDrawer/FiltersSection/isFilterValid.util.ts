import type { ColumnFilter } from '@/types/filterOperators.types';

const isDateFilterValid = (filter: Extract<ColumnFilter, { type: 'date' }>) => {
  if (!filter.value) return false;
  if (filter.operator === 'between') {
    return Boolean(filter.value2);
  }
  return true;
};

const isNumberFilterValid = (
  filter: Extract<ColumnFilter, { type: 'number' }>,
) => {
  const { operator, value, value2 } = filter;

  if (typeof value !== 'number' || Number.isNaN(value)) {
    return false;
  }

  if (operator === 'between') {
    return (
      typeof value2 === 'number' && !Number.isNaN(value2) && value2 > value
    );
  }

  return true;
};

const isSelectFilterValid = (
  filter: Extract<ColumnFilter, { type: 'multiSelect' | 'select' }>,
) => {
  if ('values' in filter && filter.values) {
    return filter.values.length > 0;
  }
  return Boolean('value' in filter && filter.value);
};

const isTextFilterValid = (filter: Extract<ColumnFilter, { type: 'text' }>) => {
  return Boolean(filter.value?.trim());
};

/**
 * Validates a filter to ensure required fields are populated
 */
export const isFilterValid = (filter?: ColumnFilter | null): boolean => {
  if (!filter) return false;

  switch (filter.type) {
    case 'boolean': {
      return true;
    }
    case 'date': {
      return isDateFilterValid(filter);
    }
    case 'multiSelect':
    case 'select': {
      return isSelectFilterValid(filter);
    }
    case 'number': {
      return isNumberFilterValid(filter);
    }
    case 'text': {
      return isTextFilterValid(filter);
    }
    default: {
      return false;
    }
  }
};
