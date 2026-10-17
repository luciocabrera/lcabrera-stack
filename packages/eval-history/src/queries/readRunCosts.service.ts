import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { SUITES } from '../envelope/envelope.constants.ts';
import { costFiguresSchema } from './costFigures.schema.ts';
import { nullAsAbsent } from './nullAsAbsent.util.ts';
import { readPublicColumns } from './readPublicColumns.service.ts';
import { runCostsQuery } from './runCostsQuery.util.ts';

type ReadRunCostsArgs = {
  readonly client: QueryClient;
  readonly perSuite: number;
};

const suite = z.enum(SUITES);

const modelId = nullAsAbsent(z.string());

const runCostRowsSchema = z.array(
  costFiguresSchema.extend({
    modelId,
    runId: z.guid(),
    startedAt: z.date(),
    suite,
  }),
);

const subjectCostRowsSchema = z.array(
  costFiguresSchema.extend({
    subjectKind: z.string(),
    subjectName: z.string(),
  }),
);

const suiteCostRowsSchema = z.array(costFiguresSchema.extend({ suite }));

export const readRunCosts = async ({ client, perSuite }: ReadRunCostsArgs) => {
  const publicColumns = await readPublicColumns({ client });
  const query = (groupBy: Parameters<typeof runCostsQuery>[0]['groupBy']) =>
    client.query(runCostsQuery({ groupBy, perSuite, publicColumns }));
  const [runs, subjects, suites] = await Promise.all([
    query('run'),
    query('subject'),
    query('suite'),
  ]);

  return {
    runs: runCostRowsSchema.parse(runs.rows),
    subjects: subjectCostRowsSchema.parse(subjects.rows),
    suites: suiteCostRowsSchema.parse(suites.rows),
  };
};
