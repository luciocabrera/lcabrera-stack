import { describe, expect, it } from 'vite-plus/test';

import { runCompareQuery } from './runCompareQuery.util.ts';

describe('runCompareQuery', () => {
  it('compares run a against run b in that order', () => {
    const query = runCompareQuery({ a: 'run-a', b: 'run-b' });

    expect(query.text).toMatch(/from evals\.run_compare\(\$1, \$2\)/);
    expect(query.values).toEqual(['run-a', 'run-b']);
  });
});
