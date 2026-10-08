import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { SUITES } from '../envelope/envelope.constants.ts';
import { subjectTrendQuery } from './subjectTrendQuery.util.ts';

type ReadSubjectTrendArgs = Parameters<typeof subjectTrendQuery>[0] & {
  readonly client: QueryClient;
};

const subjectTrendRowsSchema = z.array(
  z.object({
    contentHash: z.string(),
    k: z.number().int(),
    modelId: z.string().nullable(),
    n: z.number().int(),
    runId: z.guid(),
    startedAt: z.date(),
    subjectKind: z.string(),
    subjectName: z.string(),
    suite: z.enum(SUITES),
  }),
);

export const readSubjectTrend = async ({
  client,
  ...args
}: ReadSubjectTrendArgs) => {
  const { rows } = await client.query(subjectTrendQuery(args));

  return subjectTrendRowsSchema.parse(rows);
};
