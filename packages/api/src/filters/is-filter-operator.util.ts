import type { FilterOperatorSet } from './filters.types.ts';

type IsFilterOperatorArgs = {
  readonly operators: FilterOperatorSet<string>;
  readonly value: unknown;
};

export const isFilterOperator = ({ operators, value }: IsFilterOperatorArgs) =>
  typeof value === 'string' && Object.hasOwn(operators, value);
