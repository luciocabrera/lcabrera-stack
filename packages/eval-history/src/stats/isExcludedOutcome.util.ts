import type { Outcome } from './stats.types.ts';

import { EXCLUDED_OUTCOMES } from './stats.constants.ts';

export const isExcludedOutcome = (outcome: Outcome) =>
  EXCLUDED_OUTCOMES.includes(outcome);
