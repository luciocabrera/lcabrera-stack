import { describe, expect, it } from 'vite-plus/test';

import type { QueryClient, SqlQuery } from '../queries/queries.types.ts';

import { pruneTranscriptsQuery } from './pruneTranscriptsQuery.util.ts';
import { retainEvals } from './retainEvals.service.ts';
import { trimSnapshotsQuery } from './trimSnapshotsQuery.util.ts';

const NOW = new Date('2026-10-18T00:00:00.000Z');

type CountingClientArgs = {
  readonly counts: readonly (readonly unknown[])[];
};

const countingClient = ({ counts }: CountingClientArgs) => {
  const sent: SqlQuery[] = [];
  const replies = [...counts];
  const client: QueryClient = {
    query: (query) => {
      sent.push(query);

      const rows = query.text.startsWith('with') ? replies.shift() : [];

      return Promise.resolve({ rows: rows ?? [] });
    },
  };

  return { client, sent };
};

describe('retainEvals', () => {
  it('prunes transcripts and trims snapshots in one transaction', async () => {
    const { client, sent } = countingClient({
      counts: [[{ count: 3 }], [{ count: 1 }]],
    });

    expect(await retainEvals({ client, now: NOW })).toEqual({
      snapshots: 1,
      transcripts: 3,
    });
    expect(sent).toEqual([
      { text: 'begin', values: [] },
      pruneTranscriptsQuery({
        keptBranch: 'main',
        now: NOW,
        retentionDays: 90,
      }),
      trimSnapshotsQuery(20),
      { text: 'commit', values: [] },
    ]);
  });

  it('rolls back and rethrows when a reply is not one count', async () => {
    const { client, sent } = countingClient({ counts: [[{ count: 3 }], []] });

    await expect(retainEvals({ client, now: NOW })).rejects.toThrow(
      expect.objectContaining({
        issues: [expect.objectContaining({ path: [] })],
      }),
    );
    expect(sent.at(-1)).toEqual({ text: 'rollback', values: [] });
  });
});
