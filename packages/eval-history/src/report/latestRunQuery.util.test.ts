import { describe, expect, it } from 'vite-plus/test';

import { latestRunQuery } from './latestRunQuery.util.ts';

describe('latestRunQuery', () => {
  it('reads the newest complete run of a suite on a branch', () => {
    const { text, values } = latestRunQuery({
      branch: 'main',
      suite: 'skills',
    });

    expect(values).toEqual(['main', 'skills']);
    expect(text).toContain(
      "where branch = $1 and suite = $2 and status = 'complete'",
    );
    expect(text).toContain('order by started_at desc\nlimit 1');
  });
});
