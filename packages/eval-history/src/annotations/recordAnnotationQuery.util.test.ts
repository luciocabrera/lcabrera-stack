import { describe, expect, it } from 'vite-plus/test';

import { recordAnnotationQuery } from './recordAnnotationQuery.util.ts';

describe('recordAnnotationQuery', () => {
  it('inserts one annotation and binds every field as a parameter', () => {
    const query = recordAnnotationQuery({
      at: '2026-10-08T09:00:00.000Z',
      author: 'lucio',
      kind: 'incident',
      text: "a note with a ' quote",
    });

    expect(query.text).toMatch(/^insert into evals\.eval_annotation /u);
    expect(query.text).not.toContain('quote');
    expect(query.values).toEqual([
      '2026-10-08T09:00:00.000Z',
      'incident',
      "a note with a ' quote",
      'lucio',
    ]);
  });
});
