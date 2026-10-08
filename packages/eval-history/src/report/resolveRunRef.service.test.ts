import { describe, expect, it } from 'vite-plus/test';

import { recordingClient } from '../queries/recordingClient.util.ts';
import { resolveRunRef } from './resolveRunRef.service.ts';

const RUN_ID = '00000000-0000-4000-8000-000000000001';

const unreadable = (file: string) =>
  Promise.resolve({
    file,
    ok: false,
    problems: ['could not read: ENOENT'],
  } as const);

describe('resolveRunRef', () => {
  it('reads a run id from the database and says when it is absent', async () => {
    const { client, sent } = recordingClient([]);

    await expect(
      resolveRunRef({ client, readEnvelope: unreadable, ref: RUN_ID }),
    ).rejects.toThrow(`run ${RUN_ID} is not in the database`);
    expect(sent).toHaveLength(1);
  });

  it('reads anything else as an envelope file and names the problem', async () => {
    await expect(
      resolveRunRef({
        client: undefined,
        readEnvelope: unreadable,
        ref: 'runs/a.json',
      }),
    ).rejects.toThrow(
      'runs/a.json is neither a run id nor a readable envelope: could not read: ENOENT',
    );
  });
});
