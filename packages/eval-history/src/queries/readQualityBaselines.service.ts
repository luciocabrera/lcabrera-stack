import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { qualityBaselinesQuery } from './qualityBaselinesQuery.util.ts';
import { readPublicColumns } from './readPublicColumns.service.ts';

type ReadQualityBaselinesArgs = {
  readonly client: QueryClient;
};

const qualityBaselineRowSchema = z.object({
  baselineId: z.guid(),
  modelId: z.string(),
  runIds: z.array(z.guid()),
  subjectKind: z.string(),
  subjectName: z.string(),
});

const qualityBaselineRowsSchema = z.array(qualityBaselineRowSchema);

export const readQualityBaselines = async ({
  client,
}: ReadQualityBaselinesArgs) => {
  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(qualityBaselinesQuery({ publicColumns }));

  return qualityBaselineRowsSchema.parse(rows);
};
