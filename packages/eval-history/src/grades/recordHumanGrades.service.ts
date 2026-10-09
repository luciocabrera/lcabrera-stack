import { z } from 'zod';

import type { QueryClient } from '../queries/queries.types.ts';
import type { HumanScore } from './grades.types.ts';

import { gradeProblems } from './gradeProblems.util.ts';
import { judgedDimensionsQuery } from './judgedDimensionsQuery.util.ts';
import { recordGradesQuery } from './recordGradesQuery.util.ts';

type RecordHumanGradesArgs = {
  readonly client: QueryClient;
  readonly grader: string;
  readonly scores: readonly HumanScore[];
  readonly trialId: string;
};

const namedRowsSchema = z.array(z.object({ name: z.string() }));

const recordedRowsSchema = z.array(z.object({ dimension: z.string() }));

export const recordHumanGrades = async ({
  client,
  grader,
  scores,
  trialId,
}: RecordHumanGradesArgs) => {
  const { rows } = await client.query(judgedDimensionsQuery({ trialId }));
  const problems = gradeProblems({
    judged: namedRowsSchema.parse(rows).map(({ name }) => name),
    scores,
    trialId,
  });

  if (problems.length > 0) {
    return { kind: 'rejected', problems } as const;
  }

  const { rows: recorded } = await client.query(
    recordGradesQuery({ grader, scores, trialId }),
  );

  return {
    dimensions: recordedRowsSchema
      .parse(recorded)
      .map(({ dimension }) => dimension),
    kind: 'recorded',
  } as const;
};
