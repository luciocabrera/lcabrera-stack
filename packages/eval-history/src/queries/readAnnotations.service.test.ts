import { describe, expect, it } from 'vite-plus/test';

import { readAnnotations } from './readAnnotations.service.ts';
import { schemaColumnsOf } from './schemaColumnsOf.util.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = schemaColumnsOf({ eval_annotation: ['at', 'id', 'kind'] });

const range = {
  from: new Date('2026-01-01T00:00:00Z'),
  to: new Date('2026-02-01T00:00:00Z'),
};

const row = {
  annotationId: '3',
  at: new Date('2026-01-10T00:00:00Z'),
  kind: 'model-change',
};

describe('readAnnotations', () => {
  it('derives the public columns first, then reads the range', async () => {
    const { client, sent } = scriptedClient({
      answer: () => [row],
      columns: COLUMNS,
    });

    expect(await readAnnotations({ client, ...range })).toEqual([row]);
    expect(sent.map(({ values }) => values)).toEqual([
      [],
      [range.from, range.to],
    ]);
  });

  it('rejects an annotation of an unknown kind', async () => {
    const { client } = scriptedClient({
      answer: () => [{ ...row, kind: 'gossip' }],
      columns: COLUMNS,
    });

    await expect(readAnnotations({ client, ...range })).rejects.toThrow();
  });
});
