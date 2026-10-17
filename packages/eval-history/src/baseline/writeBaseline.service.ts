import { z } from 'zod';

import type { QueryClient } from '../queries/queries.types.ts';
import type { BaselineRow, BaselineSubject } from './baseline.types.ts';

import { inSequence } from '../ingest/inSequence.service.ts';
import {
  INSERT_BASELINE_SQL,
  SELECT_SUBJECT_ID_SQL,
} from './baseline.constants.ts';

type InsertRowArgs = {
  readonly client: QueryClient;
  readonly row: BaselineRow;
};

type SubjectIdArgs = {
  readonly client: QueryClient;
  readonly subject: BaselineSubject | undefined;
};

type WriteBaselineArgs = {
  readonly client: QueryClient;
  readonly rows: readonly BaselineRow[];
};

const subjectIdRowsSchema = z.array(z.object({ id: z.coerce.number() }));

const subjectId = async ({ client, subject }: SubjectIdArgs) => {
  if (subject === undefined) {
    return;
  }

  const { rows } = await client.query({
    text: SELECT_SUBJECT_ID_SQL,
    values: [subject.kind, subject.name],
  });
  const [row] = subjectIdRowsSchema.parse(rows);

  if (row === undefined) {
    throw new Error(
      `${subject.kind} ${subject.name} is not in evals.eval_subject; ingest the baseline's runs before writing it`,
    );
  }

  return row.id;
};

const insertRow = async ({ client, row }: InsertRowArgs) => {
  await client.query({
    text: INSERT_BASELINE_SQL,
    values: [
      row.baselineId,
      row.suite,
      row.modelId,
      await subjectId({ client, subject: row.subject }),
      row.metric,
      row.gitSha,
      row.nRuns,
      row.mean,
      row.stddev,
    ],
  });
};

export const writeBaseline = async ({ client, rows }: WriteBaselineArgs) => {
  await client.query({ text: 'begin', values: [] });

  try {
    await inSequence({
      items: rows,
      step: (row) => insertRow({ client, row }),
    });
    await client.query({ text: 'commit', values: [] });

    return rows.length;
  } catch (error) {
    await client.query({ text: 'rollback', values: [] });
    throw error;
  }
};
