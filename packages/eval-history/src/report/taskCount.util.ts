import type { Outcome } from '../stats/stats.types.ts';

import { countOutcomes } from '../stats/countOutcomes.util.ts';

export const taskCount = (outcomes: readonly Outcome[] | undefined) =>
  outcomes === undefined ? undefined : countOutcomes(outcomes);
