import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { OUTCOMES, SUITES } from '../envelope/envelope.constants.ts';
import { runCompareQuery } from './runCompareQuery.util.ts';

type ReadRunComparisonArgs = Parameters<typeof runCompareQuery>[0] & {
  readonly client: QueryClient;
};

const hash = z.string().nullable();
const count = z.number().int().nullable();
const outcomes = z.array(z.enum(OUTCOMES)).nullable();

const runComparisonRowsSchema = z.array(
  z.object({
    agentPromptHashA: hash,
    agentPromptHashB: hash,
    contentHashA: hash,
    contentHashB: hash,
    expectedHashA: hash,
    expectedHashB: hash,
    fixtureHashA: hash,
    fixtureHashB: hash,
    judgePromptHashA: hash,
    judgePromptHashB: hash,
    kA: count,
    kB: count,
    nA: count,
    nB: count,
    outcomesA: outcomes,
    outcomesB: outcomes,
    subjectKind: z.string(),
    subjectName: z.string(),
    suite: z.enum(SUITES),
    taskHashA: hash,
    taskHashB: hash,
    taskKey: z.string(),
  }),
);

export const readRunComparison = async ({
  client,
  ...args
}: ReadRunComparisonArgs) => {
  const { rows } = await client.query(runCompareQuery(args));

  return runComparisonRowsSchema.parse(rows);
};
