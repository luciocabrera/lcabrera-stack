import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { readPublicColumns } from './readPublicColumns.service.ts';
import { runSummariesQuery } from './runSummariesQuery.util.ts';
import { runSummaryRowSchema } from './runSummaryRow.schema.ts';

type ReadRunSummariesArgs = Pick<
  Parameters<typeof runSummariesQuery>[0],
  'scope'
> & {
  readonly client: QueryClient;
};

const runSummaryRowsSchema = z.array(runSummaryRowSchema);

export const readRunSummaries = async ({
  client,
  scope,
}: ReadRunSummariesArgs) => {
  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(
    runSummariesQuery({ publicColumns, scope }),
  );

  return runSummaryRowsSchema.parse(rows);
};
