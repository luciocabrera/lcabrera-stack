import { describe, expect, it } from 'vite-plus/test';

import { runLabel } from './runLabel.util.ts';

describe('runLabel', () => {
  it('appends the short sha to the branch', () => {
    expect(
      runLabel({ branch: 'main', gitSha: `1234567${'a'.repeat(33)}` }),
    ).toBe('main@1234567');
  });
});
