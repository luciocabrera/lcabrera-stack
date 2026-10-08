import { z } from 'zod';

import type { QueryClient } from '../queries/queries.types.ts';

import { latestRunQuery } from './latestRunQuery.util.ts';

type ReadLatestRunIdArgs = Parameters<typeof latestRunQuery>[0] & {
  readonly client: QueryClient;
};

const latestRunRowsSchema = z.array(z.object({ runId: z.guid() })).max(1);

export const readLatestRunId = async ({
  client,
  ...args
}: ReadLatestRunIdArgs) => {
  const { rows } = await client.query(latestRunQuery(args));

  return latestRunRowsSchema.parse(rows)[0]?.runId;
};
