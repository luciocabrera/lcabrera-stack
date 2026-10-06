import type { Outcome } from './stats.types.ts';

import { countOutcomes } from './countOutcomes.util.ts';

export const hasPassHatK = (outcomes: readonly Outcome[]) => {
  const { k, n } = countOutcomes(outcomes);

  return n > 0 && k === n;
};
