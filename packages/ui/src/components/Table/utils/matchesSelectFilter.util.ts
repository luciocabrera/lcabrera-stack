import type { SelectFilter } from '#ui/types/filterOperators.types';

import { isEmptyCellValue } from '#ui/components/Table/cellRenderers/isEmptyCellValue.util';

import { toCellText } from './toCellText.util';

type MatchesSelectFilterArgs = {
  readonly filter: SelectFilter;
  readonly value: unknown;
};

export const matchesSelectFilter = ({
  filter,
  value,
}: MatchesSelectFilterArgs) => {
  const { operator, value: single, values } = filter;
  const chosen = values !== undefined && values.length > 0 ? values : [single];

  if (chosen.every((entry) => entry === undefined || entry === '')) return true;
  if (isEmptyCellValue(value)) return false;

  const isChosen = chosen.includes(toCellText(value));

  return operator === 'notEquals' ? !isChosen : isChosen;
};
