import { describe, expect, it } from 'vite-plus/test';

import { trimSnapshotsQuery } from './trimSnapshotsQuery.util.ts';

describe('trimSnapshotsQuery', () => {
  it('binds how many snapshots each subject keeps', () => {
    expect(trimSnapshotsQuery(20).values).toEqual([20]);
  });

  it('ranks only the versions that still hold content, newest first', () => {
    const { text } = trimSnapshotsQuery(20);

    expect(text).toContain(
      'partition by subject_id order by first_seen_at desc, id desc',
    );
    expect(text).toContain('where content is not null');
  });

  it('clears the content and keeps the version row', () => {
    const { text } = trimSnapshotsQuery(20);

    expect(text).toContain('set content = null');
    expect(text).not.toMatch(/\bdelete\b/u);
  });
});
