import { z } from 'zod';

import { SUITES } from '../envelope/envelope.constants.ts';
import { nullAsAbsent } from './nullAsAbsent.util.ts';

const count = z.number().int().nonnegative();

export const subjectRunRowSchema = z.object({
  contentHashes: z.array(z.string()).min(1),
  k: count,
  modelId: nullAsAbsent(z.string()),
  n: count,
  runId: z.guid(),
  startedAt: z.date(),
  subjectKind: z.string(),
  subjectName: z.string(),
  suite: z.enum(SUITES),
  taskKeys: z.array(z.string()),
  trialId: z.string().regex(/^\d+$/u),
  trials: count,
});
