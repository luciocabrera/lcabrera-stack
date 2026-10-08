import { describe, expect, it } from 'vite-plus/test';

import { readSubjectTrend } from './readSubjectTrend.service.ts';
import { recordingClient } from './recordingClient.util.ts';
import { subjectTrendQuery } from './subjectTrendQuery.util.ts';

const row = {
  contentHash: 'c'.repeat(64),
  k: 4,
  modelId: 'model-a',
  n: 6,
  runId: '00000000-0000-4000-8000-000000000001',
  startedAt: new Date('2026-01-01T02:00:00Z'),
  subjectKind: 'skill',
  subjectName: 'react-19',
  suite: 'skills',
};

describe('readSubjectTrend', () => {
  const args = { kind: 'skill', limit: 30, name: 'react-19' };

  it('sends the trend query and returns the typed rows', async () => {
    const { client, sent } = recordingClient([row]);

    expect(await readSubjectTrend({ client, ...args })).toEqual([row]);
    expect(sent).toEqual([subjectTrendQuery(args)]);
  });

  it('rejects a row from an unknown suite', async () => {
    const { client } = recordingClient([{ ...row, suite: 'unknown' }]);

    await expect(readSubjectTrend({ client, ...args })).rejects.toThrow();
  });
});
