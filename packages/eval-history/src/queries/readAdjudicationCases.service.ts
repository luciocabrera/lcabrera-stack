import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { GROUND_TRUTH_SOURCES } from '../adjudications/adjudications.constants.ts';
import {
  ADJUDICATION_OUTCOMES,
  ADJUDICATION_VERDICTS,
} from '../envelope/envelope.constants.ts';
import { adjudicationCasesQuery } from './adjudicationCasesQuery.util.ts';
import { nullAsAbsent } from './nullAsAbsent.util.ts';
import { readPublicColumns } from './readPublicColumns.service.ts';

type ReadAdjudicationCasesArgs = {
  readonly client: QueryClient;
};

const adjudicationCaseRowSchema = z.object({
  analyzer: z.string(),
  builderModel: nullAsAbsent(z.string()),
  caseId: z.string(),
  createdAt: z.date(),
  outcome: z.enum(ADJUDICATION_OUTCOMES),
  pr: nullAsAbsent(z.int().positive()),
  rule: z.string(),
  truth: nullAsAbsent(z.enum(ADJUDICATION_VERDICTS)),
  truthSource: nullAsAbsent(z.enum(GROUND_TRUTH_SOURCES)),
});

const adjudicationCaseRowsSchema = z.array(adjudicationCaseRowSchema);

export const readAdjudicationCases = async ({
  client,
}: ReadAdjudicationCasesArgs) => {
  const publicColumns = await readPublicColumns({ client });
  const { rows } = await client.query(
    adjudicationCasesQuery({ publicColumns }),
  );

  return adjudicationCaseRowsSchema.parse(rows);
};
