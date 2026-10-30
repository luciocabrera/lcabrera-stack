import { z } from 'zod';

import type { QueryClient } from '../queries/queries.types.ts';
import type { GroundTruth } from './adjudications.types.ts';

import { caseOutcomeQuery } from './caseOutcomeQuery.util.ts';
import { groundTruthProblems } from './groundTruthProblems.util.ts';
import { recordGroundTruthQuery } from './recordGroundTruthQuery.util.ts';

type RecordGroundTruthArgs = GroundTruth & {
  readonly client: QueryClient;
};

const outcomeRowsSchema = z.array(z.object({ outcome: z.string() }));

export const recordGroundTruth = async ({
  client,
  ...truth
}: RecordGroundTruthArgs) => {
  const { rows } = await client.query(caseOutcomeQuery(truth.caseId));
  const [stored] = outcomeRowsSchema.parse(rows);
  const problems = groundTruthProblems({
    caseId: truth.caseId,
    outcome: stored?.outcome,
    source: truth.source,
  });

  if (problems.length > 0) {
    return { kind: 'rejected', problems } as const;
  }

  await client.query(recordGroundTruthQuery(truth));

  return { kind: 'recorded', outcome: stored?.outcome } as const;
};
