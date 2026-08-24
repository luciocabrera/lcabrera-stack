import type { QueryFilter } from '../db/query-builder/query-builder.types.ts';
import type { SelectFilter } from './filters.types.ts';

export type ToSelectQueryFiltersArgs = {
  readonly column: string;
  readonly filter: SelectFilter;
};

export const toSelectQueryFilters = ({
  column,
  filter,
}: ToSelectQueryFiltersArgs): readonly QueryFilter[] => {
  const { operator, value, values } = filter;

  if (values && values.length > 0) {
    return operator === 'notEquals'
      ? values.map((entry) => ({ column, operator: 'neq', value: entry }))
      : [{ column, operator: 'in', value: values }];
  }

  if (value !== undefined && value !== '') {
    return [
      { column, operator: operator === 'notEquals' ? 'neq' : 'eq', value },
    ];
  }

  return [];
};
