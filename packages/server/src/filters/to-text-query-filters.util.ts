import type { QueryFilter } from '../db/query-builder/query-builder.types.ts';
import type { TextFilter } from './filters.types.ts';

export type ToTextQueryFiltersArgs = {
  readonly column: string;
  readonly filter: TextFilter;
};

export const toTextQueryFilters = ({
  column,
  filter,
}: ToTextQueryFiltersArgs): readonly QueryFilter[] => {
  const { operator, value } = filter;

  if (value === '') {
    return [];
  }

  switch (operator) {
    case 'contains': {
      return [{ column, operator: 'ilike', value: `%${value}%` }];
    }
    case 'endsWith': {
      return [{ column, operator: 'ilike', value: `%${value}` }];
    }
    case 'notContains': {
      return [{ column, operator: 'notIlike', value: `%${value}%` }];
    }
    case 'notEquals': {
      return [{ column, operator: 'neq', value }];
    }
    case 'startsWith': {
      return [{ column, operator: 'ilike', value: `${value}%` }];
    }
    default: {
      return [{ column, operator: 'eq', value }];
    }
  }
};
