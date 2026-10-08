import { z } from 'zod';

import type { QueryClient } from '../queries/queries.types.ts';

import { OUTCOMES, SUITES } from '../envelope/envelope.constants.ts';
import { reportRunQueries } from './reportRunQueries.util.ts';

type ReadReportRunArgs = {
  readonly client: QueryClient;
  readonly runId: string;
};

const absentAsUndefined = <Value>(value: null | Value) => value ?? undefined;

const hash = z.string().nullable().transform(absentAsUndefined);

const cost = z.number().nullable().transform(absentAsUndefined);

const durations = z.array(z.number().int());

const outcomes = z.array(z.enum(OUTCOMES));

const runRowsSchema = z
  .array(
    z.object({
      branch: z.string(),
      catalogHash: hash,
      costUsdReported: cost,
      durationsMs: durations,
      gitSha: z.string(),
      harnessVersion: z.string(),
      modelId: hash,
      runId: z.guid(),
      status: z.enum(['aborted', 'complete', 'partial']),
      suite: z.enum(SUITES),
    }),
  )
  .max(1);

const subjectRowsSchema = z.array(
  z.object({ contentHash: z.string(), kind: z.string(), name: z.string() }),
);

const taskRowsSchema = z.array(
  z.object({
    agentPromptHash: hash,
    expectedHash: hash,
    fixtureHash: hash,
    judgePromptHash: hash,
    outcomes,
    taskHash: z.string(),
    taskKey: z.string(),
  }),
);

export const readReportRun = async ({ client, runId }: ReadReportRunArgs) => {
  const queries = reportRunQueries(runId);
  const { rows: runRows } = await client.query(queries.run);
  const [run] = runRowsSchema.parse(runRows);

  if (run === undefined) {
    return;
  }

  const { rows: subjectRows } = await client.query(queries.subjects);
  const { rows: taskRows } = await client.query(queries.tasks);

  return {
    ...run,
    subjects: subjectRowsSchema.parse(subjectRows),
    tasks: taskRowsSchema.parse(taskRows),
  };
};
