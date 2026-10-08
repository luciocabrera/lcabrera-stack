import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { SUITES } from '../envelope/envelope.constants.ts';
import { taskPassRatesQuery } from './taskPassRatesQuery.util.ts';

type ReadTaskPassRatesArgs = Parameters<typeof taskPassRatesQuery>[0] & {
  readonly client: QueryClient;
};

const taskPassRateRowsSchema = z.array(
  z.object({
    k: z.number().int(),
    kind: z.string(),
    modelId: z.string().nullable(),
    n: z.number().int(),
    passAtK: z.boolean(),
    passHatK: z.boolean(),
    runId: z.guid(),
    startedAt: z.date(),
    suite: z.enum(SUITES),
    taskHash: z.string(),
    taskKey: z.string(),
    taskSet: z.string(),
  }),
);

export const readTaskPassRates = async ({
  client,
  ...args
}: ReadTaskPassRatesArgs) => {
  const { rows } = await client.query(taskPassRatesQuery(args));

  return taskPassRateRowsSchema.parse(rows);
};
