import { z } from 'zod';

import { nullAsAbsent } from './nullAsAbsent.util.ts';

const count = z.number().int().nonnegative();
const trialId = z.string().regex(/^\d+$/u);

export const costFiguresSchema = z.object({
  computedTrials: count,
  computedUsd: nullAsAbsent(z.number()),
  costliestTrialId: trialId,
  p50Ms: nullAsAbsent(z.number()),
  p95Ms: nullAsAbsent(z.number()),
  reportedTrials: count,
  reportedUsd: nullAsAbsent(z.number()),
  slowestTrialId: trialId,
  tokensCacheRead: z.number().nonnegative(),
  tokensCacheWrite: z.number().nonnegative(),
  tokensIn: z.number().nonnegative(),
  tokensOut: z.number().nonnegative(),
  trials: count,
});
