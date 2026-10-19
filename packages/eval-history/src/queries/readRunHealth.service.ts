import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { nullAsAbsent } from './nullAsAbsent.util.ts';
import { readPublicColumns } from './readPublicColumns.service.ts';
import { runHealthQuery } from './runHealthQuery.util.ts';

type ReadRunHealthArgs = Omit<
  Parameters<typeof runHealthQuery>[0],
  'publicColumns'
> & {
  readonly client: QueryClient;
};

const runHealthRowSchema = z.object({
  errorClass: nullAsAbsent(z.string()),
  outcome: z.enum(['error', 'timeout']),
  runId: z.guid(),
  trials: z.number().int().positive(),
});

const runHealthRowsSchema = z.array(runHealthRowSchema);

export const readRunHealth = async ({ client, ...args }: ReadRunHealthArgs) => {
  if (args.runIds.length === 0) {
    return [];
  }

  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(
    runHealthQuery({ ...args, publicColumns }),
  );

  return runHealthRowsSchema.parse(rows);
};
