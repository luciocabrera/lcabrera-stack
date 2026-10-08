import { describe, expect, it } from 'vite-plus/test';

import { recordingClient } from './recordingClient.util.ts';

describe('recordingClient', () => {
  it('answers every query with the given rows and records what was sent', async () => {
    const { client, sent } = recordingClient([{ id: 1 }]);
    const query = { text: 'select 1', values: [] };

    expect(await client.query(query)).toEqual({ rows: [{ id: 1 }] });
    expect(sent).toEqual([query]);
  });
});
