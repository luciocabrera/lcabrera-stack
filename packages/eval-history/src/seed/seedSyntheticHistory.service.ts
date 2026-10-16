import { z } from 'zod';

import type { MigrationClient } from '../migrate/migrate.types.ts';
import type { SyntheticShape } from './seed.types.ts';

import {
  SYNTHETIC_HISTORY_STATEMENTS,
  SYNTHETIC_PRIVATE_TEXT,
  SYNTHETIC_SHAPE,
} from './seed.constants.ts';

type SeedSyntheticHistoryArgs = {
  readonly client: MigrationClient;
  readonly endsOn: string;
  readonly shape?: SyntheticShape;
};

const countsSchema = z.array(
  z.object({ runs: z.number().int(), trials: z.number().int() }),
);

const COUNTS_SQL =
  'select (select count(*) from evals.eval_run)::integer as runs, (select count(*) from evals.eval_trial)::integer as trials';

const readCounts = async (client: MigrationClient) => {
  const { rows } = await client.query({ text: COUNTS_SQL });
  const [counts] = countsSchema.parse(rows);

  return counts ?? { runs: 0, trials: 0 };
};

type RunInOrderArgs = {
  readonly client: MigrationClient;
  readonly statements: readonly string[];
  readonly values: unknown[];
};

const runInOrder = async ({
  client,
  statements,
  values,
}: RunInOrderArgs): Promise<void> => {
  const [text, ...rest] = statements;

  if (text === undefined) {
    return;
  }

  await client.query({ text, values });
  await runInOrder({ client, statements: rest, values });
};

const insertHistory = async ({
  client,
  endsOn,
  shape = SYNTHETIC_SHAPE,
}: SeedSyntheticHistoryArgs) => {
  const values = [
    endsOn,
    shape.nights,
    shape.subjects,
    shape.trialsPerTask,
    SYNTHETIC_PRIVATE_TEXT,
  ];

  await runInOrder({
    client,
    statements: SYNTHETIC_HISTORY_STATEMENTS,
    values,
  });
};

export const seedSyntheticHistory = async (args: SeedSyntheticHistoryArgs) => {
  const { client } = args;

  await client.query({ text: 'begin' });

  try {
    const before = await readCounts(client);

    if (before.runs > 0) {
      throw new Error(
        `evals.eval_run already holds ${String(before.runs)} runs; seed synthetic history into an empty database`,
      );
    }

    await insertHistory(args);
    const after = await readCounts(client);

    await client.query({ text: 'commit' });

    return after;
  } catch (error) {
    await client.query({ text: 'rollback' });
    throw error;
  }
};
