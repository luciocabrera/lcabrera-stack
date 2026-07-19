import type { QueryFilter } from '@repo/data-access/db/queryBuilder/QueryBuilder.types';
import type { SelectFilter } from '@repo/ui/types/filterOperators.types';

export type ToSelectQueryFiltersArgs = {
  readonly column: string;
  readonly filter: SelectFilter;
};

/**
 * Translate a table select/multi-select filter to generic `QueryFilter`s.
 * A multi-value `equals` uses `in`; multi-value `notEquals` is expressed as an
 * AND of `neq`s (equivalent to NOT IN, which the generic operator set lacks).
 * A single value maps to `eq`/`neq`.
 */
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
