import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { readPublicColumns } from './readPublicColumns.service.ts';
import { subjectRunRowSchema } from './subjectRunRow.schema.ts';
import { subjectRunsQuery } from './subjectRunsQuery.util.ts';

type ReadSubjectRunsArgs = Pick<
  Parameters<typeof subjectRunsQuery>[0],
  'scope'
> & {
  readonly client: QueryClient;
};

const subjectRunRowsSchema = z.array(subjectRunRowSchema);

export const readSubjectRuns = async ({
  client,
  scope,
}: ReadSubjectRunsArgs) => {
  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(
    subjectRunsQuery({ publicColumns, scope }),
  );

  return subjectRunRowsSchema.parse(rows);
};
