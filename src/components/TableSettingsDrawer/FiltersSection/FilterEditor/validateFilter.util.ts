import type { ColumnFilter } from '@/components/Table/Table.types';

/**
 * Validates a filter to ensure required fields are populated
 */
export const validateFilter = (
  filter: ColumnFilter | null | undefined,
): boolean => {
  if (!filter) return false;

  switch (filter.type) {
    case 'boolean': {
      // Boolean filter is always valid (has a value or is undefined for "All")
      return true;
    }
    case 'date': {
      // Date filter needs at least one value
      if (!filter.value) return false;
      // Between operator needs both values
      if (filter.operator === 'between') {
        return Boolean(filter.value2);
      }
      return true;
    }
    case 'multiSelect':
    case 'select': {
      // Select needs at least one selection
      if ('values' in filter && filter.values) {
        return filter.values.length > 0;
      }
      if ('value' in filter && filter.value) {
        return true;
      }
      return false;
    }
    case 'number': {
      // Number filter always needs at least one value
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (filter.value === undefined) return false;
      // Between operator needs both values
      if (filter.operator === 'between') {
        return (
          filter.value2 !== undefined &&
          filter.value2 > filter.value
        );
      }
      return true;
    }
    case 'text': {
      // Text filter needs a value for most operators
      if (filter.operator === 'equals' || filter.operator === 'notEquals') {
        return true; // These operators don't require a value
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return Boolean(filter.value?.trim());
    }
    default: {
      return false;
    }
  }
};
