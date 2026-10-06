import type { Outcome } from './stats.types.ts';

import { countOutcomes } from './countOutcomes.util.ts';

export const hasDisagreement = (outcomes: readonly Outcome[]) => {
  const { k, n } = countOutcomes(outcomes);

  return k > 0 && k < n;
};
