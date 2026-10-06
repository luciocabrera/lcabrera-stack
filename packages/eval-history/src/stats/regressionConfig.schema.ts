import { z } from 'zod';

import { MIN_BASELINE_RUNS } from './stats.constants.ts';

const positiveInt = z.int().positive();

const flipSchema = z
  .strictObject({ failAtLeast: positiveInt, ofTrials: positiveInt })
  .refine(({ failAtLeast, ofTrials }) => failAtLeast <= ofTrials, {
    message: 'failAtLeast cannot exceed ofTrials',
    path: ['failAtLeast'],
  })
  .readonly();

export const regressionConfigSchema = z
  .strictObject({
    baseline: z
      .strictObject({ defaultRuns: z.int().min(MIN_BASELINE_RUNS) })
      .readonly(),
    binary: z.strictObject({ flip: flipSchema }).readonly(),
    flaky: z
      .strictObject({
        disagreeFraction: z.number().min(0).max(1),
        window: positiveInt,
      })
      .readonly(),
    minTrialsForRate: positiveInt,
    scored: z.strictObject({ sigma: z.number().positive() }).readonly(),
    z: z.number().positive(),
  })
  .readonly();
