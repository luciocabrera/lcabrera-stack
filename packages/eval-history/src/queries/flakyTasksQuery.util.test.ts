import { describe, expect, it } from 'vite-plus/test';

import { flakyTasksQuery } from './flakyTasksQuery.util.ts';

describe('flakyTasksQuery', () => {
  it('passes the window to the function and keeps tasks above the fraction', () => {
    const query = flakyTasksQuery({ disagreeFraction: 0.2, window: 10 });

    expect(query.text).toMatch(/from evals\.flaky_tasks\(\$1\)/);
    expect(query.text).toMatch(
      /where disagreeing > \$2::double precision \* runs/,
    );
    expect(query.values).toEqual([10, 0.2]);
  });
});
