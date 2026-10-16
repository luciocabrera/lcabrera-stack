import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { SUITES } from '../envelope/envelope.constants.ts';
import { flakyTasksQuery } from './flakyTasksQuery.util.ts';

type ReadFlakyTasksArgs = Parameters<typeof flakyTasksQuery>[0] & {
  readonly client: QueryClient;
};

const flakyTaskRowsSchema = z.array(
  z.object({
    disagreeFraction: z.number(),
    disagreeing: z.number().int(),
    runs: z.number().int(),
    suite: z.enum(SUITES),
    taskKey: z.string(),
  }),
);

export const readFlakyTasks = async ({
  client,
  ...args
}: ReadFlakyTasksArgs) => {
  const { rows } = await client.query(flakyTasksQuery(args));

  return flakyTaskRowsSchema.parse(rows);
};
