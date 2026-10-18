import { z } from 'zod';

export const runJudgeScoreRowSchema = z.object({
  dimension: z.string(),
  score: z.number().int().min(1).max(5),
  trialId: z.string().regex(/^\d+$/u),
});
