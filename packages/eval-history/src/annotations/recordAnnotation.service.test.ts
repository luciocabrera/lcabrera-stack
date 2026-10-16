import { describe, expect, it } from 'vite-plus/test';

import { recordingClient } from '../queries/recordingClient.util.ts';
import { recordAnnotation } from './recordAnnotation.service.ts';
import { recordAnnotationQuery } from './recordAnnotationQuery.util.ts';

const annotation = {
  at: '2026-10-08T09:00:00.000Z',
  author: 'lucio',
  kind: 'harness-change',
  text: 'runners now stamp first-token time',
} as const;

const stored = {
  at: new Date(annotation.at),
  id: '7',
  kind: 'harness-change',
};

describe('recordAnnotation', () => {
  it('sends the insert and returns the stored row', async () => {
    const { client, sent } = recordingClient([stored]);

    expect(await recordAnnotation({ annotation, client })).toEqual(stored);
    expect(sent).toEqual([recordAnnotationQuery(annotation)]);
  });

  it('refuses a reply that is not exactly the one stored row', async () => {
    const { client } = recordingClient([]);

    await expect(recordAnnotation({ annotation, client })).rejects.toThrow();
  });
});
