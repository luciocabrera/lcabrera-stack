import { describe, expect, it } from 'vite-plus/test';

import { recordingClient } from '../queries/recordingClient.util.ts';
import { SELECT_LATEST_BASELINE_SQL } from './baseline.constants.ts';
import { readBaseline } from './readBaseline.service.ts';

const NO_SUBJECT: Readonly<Record<string, unknown>> = JSON.parse(
  '{"subjectKind": null, "subjectName": null}',
);

const ROW = {
  baselineId: '11111111-1111-4111-8111-111111111111',
  gitSha: 'a'.repeat(40),
  mean: 0.75,
  metric: 'pass_rate',
  modelId: 'model-a',
  nRuns: 3,
  stddev: 0.25,
  suite: 'skills',
};

describe('readBaseline', () => {
  it('asks for one suite and one model and returns a subject per row', async () => {
    const { client, sent } = recordingClient([
      { ...ROW, ...NO_SUBJECT },
      { ...ROW, subjectKind: 'skill', subjectName: 'react-19' },
    ]);

    expect(
      await readBaseline({ client, modelId: 'model-a', suite: 'skills' }),
    ).toEqual([
      { ...ROW, subject: undefined },
      { ...ROW, subject: { kind: 'skill', name: 'react-19' } },
    ]);
    expect(sent).toEqual([
      { text: SELECT_LATEST_BASELINE_SQL, values: ['skills', 'model-a'] },
    ]);
  });

  it('rejects a row whose metric the table cannot hold', async () => {
    const { client } = recordingClient([
      { ...ROW, ...NO_SUBJECT, metric: 'latency' },
    ]);

    await expect(
      readBaseline({ client, modelId: 'model-a', suite: 'skills' }),
    ).rejects.toThrow();
  });
});
