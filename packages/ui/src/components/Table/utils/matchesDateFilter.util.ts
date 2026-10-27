import { parseDate } from '@lcabrera/utils/formatters/parse-date.util';

import type { DateFilter } from '#ui/types/filterOperators.types';

import { isEmptyCellValue } from '#ui/components/Table/cellRenderers/isEmptyCellValue.util';

type MatchesDateFilterArgs = {
  readonly filter: DateFilter;
  readonly value: unknown;
};

export const matchesDateFilter = ({ filter, value }: MatchesDateFilterArgs) => {
  const { operator, value: from, value2: to } = filter;

  if (from === '') return true;
  if (isEmptyCellValue(value)) return false;

  const time = parseDate(value)?.getTime();

  if (time === undefined) return false;

  const start = parseDate(from)?.getTime() ?? NaN;

  if (operator === 'after') return time > start;
  if (operator === 'before') return time < start;

  return operator === 'between' && to !== undefined && to !== ''
    ? time >= start && time <= (parseDate(to)?.getTime() ?? NaN)
    : time === start;
};
