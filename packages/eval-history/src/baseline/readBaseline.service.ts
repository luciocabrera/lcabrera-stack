import { z } from 'zod';

import type { QueryClient } from '../queries/queries.types.ts';
import type { BaselineSuite } from './baseline.types.ts';

import {
  BASELINE_METRICS,
  BASELINE_SUITES,
  SELECT_LATEST_BASELINE_SQL,
  SUBJECT_KINDS,
} from './baseline.constants.ts';

type ReadBaselineArgs = {
  readonly client: QueryClient;
  readonly modelId: string;
  readonly suite: BaselineSuite;
};

const baselineRowsSchema = z.array(
  z
    .object({
      baselineId: z.uuid(),
      gitSha: z.string(),
      mean: z.number(),
      metric: z.enum(BASELINE_METRICS),
      modelId: z.string(),
      nRuns: z.number().int(),
      stddev: z.number(),
      subjectKind: z.enum(SUBJECT_KINDS).nullable(),
      subjectName: z.string().nullable(),
      suite: z.enum(BASELINE_SUITES),
    })
    .transform(({ subjectKind, subjectName, ...row }) => ({
      ...row,
      subject:
        subjectKind === null || subjectName === null
          ? undefined
          : { kind: subjectKind, name: subjectName },
    })),
);

export const readBaseline = async ({
  client,
  modelId,
  suite,
}: ReadBaselineArgs) => {
  const { rows } = await client.query({
    text: SELECT_LATEST_BASELINE_SQL,
    values: [suite, modelId],
  });

  return baselineRowsSchema.parse(rows);
};
