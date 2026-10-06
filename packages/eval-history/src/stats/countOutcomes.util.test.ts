import { describe, expect, it } from 'vite-plus/test';

import { countOutcomes } from './countOutcomes.util.ts';

describe('countOutcomes', () => {
  it('leaves error, timeout and skipped out of n and reports them beside it', () => {
    expect(
      countOutcomes(['pass', 'fail', 'error', 'timeout', 'skipped', 'pass']),
    ).toEqual({ excluded: 3, k: 2, n: 3 });
  });

  it('counts nothing for no outcomes', () => {
    expect(countOutcomes([])).toEqual({ excluded: 0, k: 0, n: 0 });
  });
});
