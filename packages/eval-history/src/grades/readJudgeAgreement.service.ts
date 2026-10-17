import { z } from 'zod';

import type { QueryClient } from '../queries/queries.types.ts';

import { judgeAgreementQuery } from './judgeAgreementQuery.util.ts';

type ReadJudgeAgreementArgs = {
  readonly client: QueryClient;
};

const judgeAgreementRowsSchema = z.array(
  z.object({
    humanScore: z.number().int(),
    judgeModel: z.string(),
    judgePromptHash: z.string(),
    judgeScore: z.number(),
  }),
);

export const readJudgeAgreement = async ({
  client,
}: ReadJudgeAgreementArgs) => {
  const { rows } = await client.query(judgeAgreementQuery());

  return judgeAgreementRowsSchema.parse(rows);
};
