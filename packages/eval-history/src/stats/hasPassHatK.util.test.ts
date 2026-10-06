import { describe, expect, it } from 'vite-plus/test';

import { hasPassHatK } from './hasPassHatK.util.ts';

describe('hasPassHatK', () => {
  it('holds when every counted trial passed', () => {
    expect(hasPassHatK(['pass', 'pass', 'pass'])).toBe(true);
    expect(hasPassHatK(['pass', 'timeout', 'pass'])).toBe(true);
  });

  it('fails when one trial failed', () => {
    expect(hasPassHatK(['pass', 'fail', 'pass'])).toBe(false);
  });

  it('fails when no trial was counted', () => {
    expect(hasPassHatK(['error', 'skipped'])).toBe(false);
    expect(hasPassHatK([])).toBe(false);
  });
});
