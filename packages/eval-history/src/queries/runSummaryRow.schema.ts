import { z } from 'zod';

import { SUITES } from '../envelope/envelope.constants.ts';
import { nullAsAbsent } from './nullAsAbsent.util.ts';

const count = z.number().int().nonnegative();

export const runSummaryRowSchema = z.object({
  arch: nullAsAbsent(z.string()),
  branch: z.string(),
  ciRunner: nullAsAbsent(z.string()),
  concurrency: nullAsAbsent(z.number().int()),
  costUsd: nullAsAbsent(z.number()),
  finishedAt: z.date(),
  gitDirty: z.boolean(),
  gitSha: z.string(),
  harnessVersion: z.string(),
  k: count,
  maxTurns: nullAsAbsent(z.number().int()),
  modelId: nullAsAbsent(z.string()),
  n: count,
  node: nullAsAbsent(z.string()),
  os: nullAsAbsent(z.string()),
  prNumber: nullAsAbsent(z.number().int()),
  runId: z.guid(),
  runs: nullAsAbsent(z.number().int()),
  sdkVersion: nullAsAbsent(z.string()),
  startedAt: z.date(),
  status: z.enum(['complete', 'partial', 'aborted']),
  suite: z.enum(SUITES),
  timeoutMs: nullAsAbsent(z.number().int()),
  trials: count,
  trigger: z.string(),
});
