import type { TextFilter } from '#ui/types/filterOperators.types';

import { toCellText } from './toCellText.util';

type MatchesTextFilterArgs = {
  readonly filter: TextFilter;
  readonly value: unknown;
};

export const matchesTextFilter = ({ filter, value }: MatchesTextFilterArgs) => {
  const { operator, value: needle } = filter;

  if (needle === '') return true;
  if ((value ?? undefined) === undefined) return false;

  const text = toCellText(value);
  const folded = text.toLowerCase();
  const foldedNeedle = needle.toLowerCase();

  switch (operator) {
    case 'contains': {
      return folded.includes(foldedNeedle);
    }
    case 'endsWith': {
      return folded.endsWith(foldedNeedle);
    }
    case 'notContains': {
      return !folded.includes(foldedNeedle);
    }
    case 'notEquals': {
      return text !== needle;
    }
    case 'startsWith': {
      return folded.startsWith(foldedNeedle);
    }
    default: {
      return text === needle;
    }
  }
};
