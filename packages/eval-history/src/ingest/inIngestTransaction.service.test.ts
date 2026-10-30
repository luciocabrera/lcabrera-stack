import { describe, expect, it } from 'vite-plus/test';

import type { IngestClient } from './ingest.types.ts';

import { inIngestTransaction } from './inIngestTransaction.service.ts';

const recording = () => {
  const statements: string[] = [];
  const client: IngestClient = {
    query: async ({ text }) => {
      statements.push(text);

      return { rows: [] };
    },
  };

  return { client, statements };
};

describe('inIngestTransaction', () => {
  it('commits what it inserted', async () => {
    const { client, statements } = recording();

    expect(
      await inIngestTransaction({
        client,
        write: async () => ({ result: 'inserted' as const }),
      }),
    ).toEqual({ result: 'inserted' });
    expect(statements).toEqual(['begin', 'commit']);
  });

  it.each(['present', 'conflict'] as const)(
    'rolls back when the row was %s',
    async (result) => {
      const { client, statements } = recording();

      await inIngestTransaction({ client, write: async () => ({ result }) });

      expect(statements).toEqual(['begin', 'rollback']);
    },
  );

  it('rolls back and rethrows when the write throws', async () => {
    const { client, statements } = recording();

    await expect(
      inIngestTransaction({
        client,
        write: async () => {
          throw new Error('duplicate key');
        },
      }),
    ).rejects.toThrow('duplicate key');
    expect(statements).toEqual(['begin', 'rollback']);
  });
});
