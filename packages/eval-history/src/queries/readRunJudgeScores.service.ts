import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { readPublicColumns } from './readPublicColumns.service.ts';
import { runJudgeScoreRowSchema } from './runJudgeScoreRow.schema.ts';
import { runJudgeScoresQuery } from './runJudgeScoresQuery.util.ts';

type ReadRunJudgeScoresArgs = {
  readonly client: QueryClient;
  readonly runId: string;
};

const runJudgeScoreRowsSchema = z.array(runJudgeScoreRowSchema);

export const readRunJudgeScores = async ({
  client,
  runId,
}: ReadRunJudgeScoresArgs) => {
  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(
    runJudgeScoresQuery({ publicColumns, runId }),
  );

  return runJudgeScoreRowsSchema.parse(rows);
};
