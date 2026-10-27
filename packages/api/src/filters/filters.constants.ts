import type {
  DateFilter,
  EmptyFilter,
  FilterOperatorSet,
  NumberFilter,
  SelectFilter,
  TextFilter,
} from './filters.types.ts';

export const COLUMN_FILTERS_PARAM = 'filter';

export const DATE_FILTER_OPERATORS: FilterOperatorSet<DateFilter['operator']> =
  {
    after: true,
    before: true,
    between: true,
    equals: true,
  };

export const EMPTY_FILTER_OPERATORS: FilterOperatorSet<
  EmptyFilter['operator']
> = {
  isEmpty: true,
  isNotEmpty: true,
};

export const NUMBER_FILTER_OPERATORS: FilterOperatorSet<
  NumberFilter['operator']
> = {
  between: true,
  equals: true,
  greaterThan: true,
  greaterThanOrEqual: true,
  lessThan: true,
  lessThanOrEqual: true,
  notEquals: true,
};

export const SELECT_FILTER_OPERATORS: FilterOperatorSet<
  NonNullable<SelectFilter['operator']>
> = {
  equals: true,
  notEquals: true,
};

export const TEXT_FILTER_OPERATORS: FilterOperatorSet<TextFilter['operator']> =
  {
    contains: true,
    endsWith: true,
    equals: true,
    notContains: true,
    notEquals: true,
    startsWith: true,
  };
