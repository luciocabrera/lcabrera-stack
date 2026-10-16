import { describe, expect, it } from 'vite-plus/test';

import { annotationSchema } from './annotation.schema.ts';

const valid = {
  at: '2026-10-08T09:00:00.000Z',
  author: 'lucio',
  kind: 'model-change',
  text: 'default model moved to claude-opus-5-5',
};

describe('annotationSchema', () => {
  it('accepts a timeline note of a known kind', () => {
    expect(annotationSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    { case: 'an unknown kind', change: { kind: 'rename' } },
    { case: 'blank text', change: { text: ' '.repeat(3) } },
    { case: 'a blank author', change: { author: '' } },
    { case: 'a time that is not ISO 8601', change: { at: 'yesterday' } },
  ])('rejects $case', ({ change }) => {
    expect(annotationSchema.safeParse({ ...valid, ...change }).success).toBe(
      false,
    );
  });
});
