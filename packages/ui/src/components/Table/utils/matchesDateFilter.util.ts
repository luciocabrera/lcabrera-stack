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

  const start = parseDate(from)?.getTime();

  if (start === undefined) return false;
  if (operator === 'after') return time > start;
  if (operator === 'before') return time < start;
  if (operator !== 'between' || to === undefined || to === '') {
    return time === start;
  }

  const end = parseDate(to)?.getTime();

  return end !== undefined && time >= start && time <= end;
};
