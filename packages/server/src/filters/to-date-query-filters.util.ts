import type { QueryFilter } from '../db/query-builder/query-builder.types.ts';
import type { DateFilter } from './filters.types.ts';

export type ToDateQueryFiltersArgs = {
  readonly column: string;
  readonly filter: DateFilter;
};

export const toDateQueryFilters = ({
  column,
  filter,
}: ToDateQueryFiltersArgs): readonly QueryFilter[] => {
  const { operator, value, value2 } = filter;

  if (value === '') {
    return [];
  }

  switch (operator) {
    case 'after': {
      return [{ column, operator: 'gt', value }];
    }
    case 'before': {
      return [{ column, operator: 'lt', value }];
    }
    case 'between': {
      return value2 === undefined || value2 === ''
        ? [{ column, operator: 'eq', value }]
        : [
            { column, operator: 'gte', value },
            { column, operator: 'lte', value: value2 },
          ];
    }
    default: {
      return [{ column, operator: 'eq', value }];
    }
  }
};
