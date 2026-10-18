import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { readPublicColumns } from './readPublicColumns.service.ts';
import { triggerConfusionQuery } from './triggerConfusionQuery.util.ts';

type ReadTriggerConfusionArgs = Omit<
  Parameters<typeof triggerConfusionQuery>[0],
  'publicColumns'
> & {
  readonly client: QueryClient;
};

const triggerConfusionRowSchema = z.object({
  errored: z.boolean(),
  expectedSkill: z.string(),
  invoked: z.array(z.string()),
  taskKind: z.enum(['near-miss', 'trigger']),
  trials: z.number().int().positive(),
});

const triggerConfusionRowsSchema = z.array(triggerConfusionRowSchema);

export const readTriggerConfusion = async ({
  client,
  ...args
}: ReadTriggerConfusionArgs) => {
  if (args.runIds.length === 0) {
    return [];
  }

  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(
    triggerConfusionQuery({ ...args, publicColumns }),
  );

  return triggerConfusionRowsSchema.parse(rows);
};
