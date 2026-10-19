import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { qualityScoresQuery } from './qualityScoresQuery.util.ts';
import { readPublicColumns } from './readPublicColumns.service.ts';

type ReadQualityScoresArgs = Omit<
  Parameters<typeof qualityScoresQuery>[0],
  'publicColumns'
> & {
  readonly client: QueryClient;
};

const qualityScoreRowSchema = z.object({
  dimension: z.string(),
  mean: z.number().min(1).max(5),
  runId: z.guid(),
  subjectKind: z.string(),
  subjectName: z.string(),
  trials: z.number().int().positive(),
});

const qualityScoreRowsSchema = z.array(qualityScoreRowSchema);

export const readQualityScores = async ({
  client,
  ...args
}: ReadQualityScoresArgs) => {
  if (args.runIds.length === 0) {
    return [];
  }

  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(
    qualityScoresQuery({ ...args, publicColumns }),
  );

  return qualityScoreRowsSchema.parse(rows);
};
