import type { SelectFilter } from '#ui/types/filterOperators.types';

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
  const chosen =
    values !== undefined && values.length > 0
      ? values
      : [single].filter((entry) => entry !== undefined && entry !== '');

  if (chosen.length === 0) return true;
  if ((value ?? undefined) === undefined) return false;

  const isChosen = chosen.includes(toCellText(value));

  return operator === 'notEquals' ? !isChosen : isChosen;
};
