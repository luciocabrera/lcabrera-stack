import type { NumberFilter } from '#ui/types/filterOperators.types';

import { isMissingCellValue } from './isMissingCellValue.util';

type CompareNumbersArgs = {
  readonly cell: number;
  readonly target: number;
};

type MatchesNumberFilterArgs = {
  readonly filter: NumberFilter;
  readonly value: unknown;
};

const COMPARE_BY_OPERATOR = {
  equals: ({ cell, target }: CompareNumbersArgs) => cell === target,
  greaterThan: ({ cell, target }: CompareNumbersArgs) => cell > target,
  greaterThanOrEqual: ({ cell, target }: CompareNumbersArgs) => cell >= target,
  lessThan: ({ cell, target }: CompareNumbersArgs) => cell < target,
  lessThanOrEqual: ({ cell, target }: CompareNumbersArgs) => cell <= target,
  notEquals: ({ cell, target }: CompareNumbersArgs) => cell !== target,
} as const;

export const matchesNumberFilter = ({
  filter,
  value,
}: MatchesNumberFilterArgs) => {
  const { operator, value: target, value2 } = filter;

  if (target === undefined) return true;
  if (operator === 'between' && value2 === undefined) return true;

  const cell = Number(value);

  if (isMissingCellValue(value) || Number.isNaN(cell)) return false;

  return operator === 'between'
    ? cell >= target && cell <= (value2 ?? target)
    : COMPARE_BY_OPERATOR[operator]({ cell, target });
};
