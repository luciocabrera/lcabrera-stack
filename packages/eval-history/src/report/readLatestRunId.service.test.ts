import { describe, expect, it } from 'vite-plus/test';

import { recordingClient } from '../queries/recordingClient.util.ts';
import { latestRunQuery } from './latestRunQuery.util.ts';
import { readLatestRunId } from './readLatestRunId.service.ts';

const RUN_ID = '00000000-0000-4000-8000-000000000001';
const args = { branch: 'main', suite: 'skills' } as const;

describe('readLatestRunId', () => {
  it('returns the newest complete run on the branch for the suite', async () => {
    const { client, sent } = recordingClient([{ runId: RUN_ID }]);

    expect(await readLatestRunId({ client, ...args })).toBe(RUN_ID);
    expect(sent).toEqual([latestRunQuery(args)]);
    expect(sent[0]?.text).toMatch(/status = 'complete'/u);
  });

  it('returns undefined when the branch has no such run', async () => {
    const { client } = recordingClient([]);

    expect(await readLatestRunId({ client, ...args })).toBeUndefined();
  });
});
