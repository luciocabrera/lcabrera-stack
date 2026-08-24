import type { QueryFilter } from '../db/query-builder/query-builder.types.ts';
import type { NumberFilter } from './filters.types.ts';

export type ToNumberQueryFiltersArgs = {
  readonly column: string;
  readonly filter: NumberFilter;
};

export const toNumberQueryFilters = ({
  column,
  filter,
}: ToNumberQueryFiltersArgs): readonly QueryFilter[] => {
  const { operator, value, value2 } = filter;

  if (value === undefined) {
    return [];
  }

  if (operator === 'between') {
    return value2 === undefined
      ? []
      : [
          { column, operator: 'gte', value },
          { column, operator: 'lte', value: value2 },
        ];
  }

  const operatorMap = {
    equals: 'eq',
    greaterThan: 'gt',
    greaterThanOrEqual: 'gte',
    lessThan: 'lt',
    lessThanOrEqual: 'lte',
    notEquals: 'neq',
  } as const;

  return [{ column, operator: operatorMap[operator], value }];
};
