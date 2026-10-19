import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { OUTCOMES, SUITES } from '../envelope/envelope.constants.ts';
import { readPublicColumns } from './readPublicColumns.service.ts';
import { taskTrialsQuery } from './taskTrialsQuery.util.ts';

type ReadTaskTrialsArgs = Omit<
  Parameters<typeof taskTrialsQuery>[0],
  'publicColumns'
> & {
  readonly client: QueryClient;
};

const outcomesSchema = z.array(z.enum(OUTCOMES));

const taskTrialRowSchema = z.object({
  outcomes: outcomesSchema,
  runId: z.guid(),
  suite: z.enum(SUITES),
  taskKey: z.string(),
  taskSet: z.enum(['capability', 'regression']),
});

const taskTrialRowsSchema = z.array(taskTrialRowSchema);

export const readTaskTrials = async ({
  client,
  ...args
}: ReadTaskTrialsArgs) => {
  if (args.runIds.length === 0) {
    return [];
  }

  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(
    taskTrialsQuery({ ...args, publicColumns }),
  );

  return taskTrialRowsSchema.parse(rows);
};
