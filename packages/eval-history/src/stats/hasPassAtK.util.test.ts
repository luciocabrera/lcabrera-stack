import { describe, expect, it } from 'vite-plus/test';

import { hasPassAtK } from './hasPassAtK.util.ts';

describe('hasPassAtK', () => {
  it('holds when any trial passed', () => {
    expect(hasPassAtK(['fail', 'pass', 'fail'])).toBe(true);
  });

  it('fails when no trial passed', () => {
    expect(hasPassAtK(['fail', 'error', 'fail'])).toBe(false);
    expect(hasPassAtK([])).toBe(false);
  });
});
