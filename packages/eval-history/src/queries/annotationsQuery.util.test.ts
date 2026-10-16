import { describe, expect, it } from 'vite-plus/test';

import { annotationsQuery } from './annotationsQuery.util.ts';
import { columnsNamed } from './columnsNamed.util.ts';
import { EXCLUDED_COLUMNS } from './queries.constants.ts';

const publicColumns = new Set([
  'eval_annotation.at',
  'eval_annotation.id',
  'eval_annotation.kind',
]);

const range = {
  from: new Date('2026-01-01T00:00:00Z'),
  to: new Date('2026-02-01T00:00:00Z'),
};

describe('annotationsQuery', () => {
  it('reads the annotations inside a time range', () => {
    const query = annotationsQuery({ ...range, publicColumns });

    expect(query.values).toEqual([range.from, range.to]);
    expect(query.text).toContain('where annotation.at between $1 and $2');
  });

  it('reads neither the text nor the author of an annotation', () => {
    const { text } = annotationsQuery({ ...range, publicColumns });

    expect(columnsNamed({ columns: EXCLUDED_COLUMNS, sql: text })).toEqual([]);
  });

  it('refuses to build when the time of an annotation stops being public', () => {
    expect(() =>
      annotationsQuery({
        ...range,
        publicColumns: new Set(['eval_annotation.id', 'eval_annotation.kind']),
      }),
    ).toThrow('eval_annotation.at is not on the public allow-list');
  });
});
