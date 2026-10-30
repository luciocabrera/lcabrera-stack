import { z } from 'zod';

import type { QueryClient } from '../queries/queries.types.ts';

import { VERIFIER_ROLES } from '../envelope/envelope.constants.ts';
import { adjudicationAccuracyQuery } from './adjudicationAccuracyQuery.util.ts';

type ReadAdjudicationAccuracyArgs = {
  readonly client: QueryClient;
};

const accuracyRowsSchema = z.array(
  z.object({
    correct: z.int().nonnegative(),
    falseAlarms: z.int().nonnegative(),
    missedReal: z.int().nonnegative(),
    model: z.string(),
    verdicts: z.int().positive(),
    verifierRole: z.enum(VERIFIER_ROLES),
  }),
);

export const readAdjudicationAccuracy = async ({
  client,
}: ReadAdjudicationAccuracyArgs) => {
  const { rows } = await client.query(adjudicationAccuracyQuery());

  return accuracyRowsSchema.parse(rows);
};
