import type { DateFilter } from '#ui/types/filterOperators.types';

import { isMissingCellValue } from './isMissingCellValue.util';
import { toCellText } from './toCellText.util';

type MatchesDateFilterArgs = {
  readonly filter: DateFilter;
  readonly value: unknown;
};

export const matchesDateFilter = ({ filter, value }: MatchesDateFilterArgs) => {
  const { operator, value: from, value2: to } = filter;

  if (from === '') return true;
  if (isMissingCellValue(value)) return false;

  const time =
    value instanceof Date ? value.getTime() : Date.parse(toCellText(value));

  if (Number.isNaN(time)) return false;

  const start = Date.parse(from);

  if (operator === 'after') return time > start;
  if (operator === 'before') return time < start;

  return operator === 'between' && to !== undefined && to !== ''
    ? time >= start && time <= Date.parse(to)
    : time === start;
};
