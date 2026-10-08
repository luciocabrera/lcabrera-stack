import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { readPublicColumns } from './readPublicColumns.service.ts';
import { runTrialRowSchema } from './runTrialRow.schema.ts';
import { runTrialsQuery } from './runTrialsQuery.util.ts';

type ReadRunTrialsArgs = Omit<
  Parameters<typeof runTrialsQuery>[0],
  'publicColumns'
> & {
  readonly client: QueryClient;
};

const runTrialRowsSchema = z.array(runTrialRowSchema);

const totalRowsSchema = z.tuple([z.object({ total: z.number().int() })]);

export const readRunTrials = async ({ client, ...args }: ReadRunTrialsArgs) => {
  const publicColumns = await readPublicColumns({ client });
  const { count, page } = runTrialsQuery({ ...args, publicColumns });
  const [pageResult, countResult] = await Promise.all([
    client.query(page),
    client.query(count),
  ]);
  const [{ total }] = totalRowsSchema.parse(countResult.rows);

  return { data: runTrialRowsSchema.parse(pageResult.rows), total };
};
