import type { Outcome } from './stats.types.ts';

import { countOutcomes } from './countOutcomes.util.ts';

export const hasPassAtK = (outcomes: readonly Outcome[]) =>
  countOutcomes(outcomes).k > 0;
