import type { Outcome } from './stats.types.ts';

import { isExcludedOutcome } from './isExcludedOutcome.util.ts';

export const countOutcomes = (outcomes: readonly Outcome[]) => {
  const excluded = outcomes.filter(isExcludedOutcome).length;

  return {
    excluded,
    k: outcomes.filter((outcome) => outcome === 'pass').length,
    n: outcomes.length - excluded,
  };
};
