import { describe, expect, it } from 'vite-plus/test';

import type { SqlQuery } from '../queries/queries.types.ts';
import type { BaselineRow } from './baseline.types.ts';

import {
  INSERT_BASELINE_SQL,
  SELECT_SUBJECT_ID_SQL,
} from './baseline.constants.ts';
import { writeBaseline } from './writeBaseline.service.ts';

const ROW: BaselineRow = {
  baselineId: '11111111-1111-4111-8111-111111111111',
  gitSha: 'a'.repeat(40),
  mean: 0.75,
  metric: 'pass_rate',
  modelId: 'model-a',
  nRuns: 3,
  stddev: 0.25,
  subject: { kind: 'skill', name: 'react-19' },
  suite: 'skills',
};

const clientAnswering = (subjectRows: readonly unknown[]) => {
  const sent: SqlQuery[] = [];

  return {
    client: {
      query: (query: SqlQuery) => {
        sent.push(query);

        return Promise.resolve({
          rows: query.text === SELECT_SUBJECT_ID_SQL ? subjectRows : [],
        });
      },
    },
    sent,
  };
};

describe('writeBaseline', () => {
  it('writes every row in one transaction with the subject id looked up', async () => {
    const { client, sent } = clientAnswering([{ id: '7' }]);

    expect(
      await writeBaseline({
        client,
        rows: [{ ...ROW, subject: undefined }, ROW],
      }),
    ).toBe(2);
    expect(sent).toEqual([
      { text: 'begin', values: [] },
      {
        text: INSERT_BASELINE_SQL,
        values: [
          ROW.baselineId,
          'skills',
          'model-a',
          undefined,
          'pass_rate',
          ROW.gitSha,
          3,
          0.75,
          0.25,
        ],
      },
      { text: SELECT_SUBJECT_ID_SQL, values: ['skill', 'react-19'] },
      {
        text: INSERT_BASELINE_SQL,
        values: [
          ROW.baselineId,
          'skills',
          'model-a',
          7,
          'pass_rate',
          ROW.gitSha,
          3,
          0.75,
          0.25,
        ],
      },
      { text: 'commit', values: [] },
    ]);
  });

  it('rolls back and names the subject when its runs were never ingested', async () => {
    const { client, sent } = clientAnswering([]);

    await expect(writeBaseline({ client, rows: [ROW] })).rejects.toThrow(
      "skill react-19 is not in evals.eval_subject; ingest the baseline's runs before writing it",
    );
    expect(sent.at(-1)).toEqual({ text: 'rollback', values: [] });
    expect(sent.map(({ text }) => text)).not.toContain(INSERT_BASELINE_SQL);
  });
});
