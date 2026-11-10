import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import {
  ADJUDICATION_VERDICTS,
  VERIFIER_ROLES,
} from '../envelope/envelope.constants.ts';
import { adjudicationVerdictsQuery } from './adjudicationVerdictsQuery.util.ts';
import { nullAsAbsent } from './nullAsAbsent.util.ts';
import { readPublicColumns } from './readPublicColumns.service.ts';

type ReadAdjudicationVerdictsArgs = {
  readonly client: QueryClient;
};

const count = z.int().nonnegative();

const adjudicationVerdictRowSchema = z.object({
  agentPromptHash: z.string(),
  caseId: z.string(),
  costUsd: nullAsAbsent(z.number().nonnegative()),
  durationMs: count,
  model: z.string(),
  role: z.enum(VERIFIER_ROLES),
  tokensIn: count,
  tokensOut: count,
  verdict: z.enum(ADJUDICATION_VERDICTS),
});

const adjudicationVerdictRowsSchema = z.array(adjudicationVerdictRowSchema);

export const readAdjudicationVerdicts = async ({
  client,
}: ReadAdjudicationVerdictsArgs) => {
  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(
    adjudicationVerdictsQuery({ publicColumns }),
  );

  return adjudicationVerdictRowsSchema.parse(rows);
};
