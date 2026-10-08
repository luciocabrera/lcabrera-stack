import { z } from 'zod';

import { OUTCOMES } from '../envelope/envelope.constants.ts';
import { nullAsAbsent } from './nullAsAbsent.util.ts';

const count = z.number().int().nonnegative();
const skills = z.array(z.string());

export const runTrialRowSchema = z.object({
  costUsd: nullAsAbsent(z.number()),
  durationMs: nullAsAbsent(count),
  errorClass: nullAsAbsent(z.string()),
  expectedSkill: nullAsAbsent(z.string()),
  invoked: nullAsAbsent(skills),
  outcome: z.enum(OUTCOMES),
  overall: nullAsAbsent(z.number()),
  subjectKind: z.string(),
  subjectName: z.string(),
  taskKey: z.string(),
  taskKind: z.string(),
  taskSet: z.string(),
  tokensIn: count,
  tokensOut: count,
  trialId: z.string().regex(/^\d+$/u),
  trialIndex: count,
  turns: nullAsAbsent(count),
  verdict: nullAsAbsent(z.enum(['PASS', 'FAIL'])),
});
