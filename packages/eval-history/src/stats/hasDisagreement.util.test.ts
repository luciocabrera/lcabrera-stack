import { describe, expect, it } from 'vite-plus/test';

import { hasDisagreement } from './hasDisagreement.util.ts';

describe('hasDisagreement', () => {
  it('holds when the counted trials include both a pass and a fail', () => {
    expect(hasDisagreement(['pass', 'fail', 'pass'])).toBe(true);
  });

  it('fails when every counted trial agrees', () => {
    expect(hasDisagreement(['pass', 'pass'])).toBe(false);
    expect(hasDisagreement(['fail', 'fail'])).toBe(false);
  });

  it('does not treat an excluded outcome as disagreement', () => {
    expect(hasDisagreement(['pass', 'error', 'timeout', 'skipped'])).toBe(
      false,
    );
    expect(hasDisagreement([])).toBe(false);
  });
});
