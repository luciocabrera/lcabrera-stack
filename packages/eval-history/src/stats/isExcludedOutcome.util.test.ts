import { describe, expect, it } from 'vite-plus/test';

import { isExcludedOutcome } from './isExcludedOutcome.util.ts';

describe('isExcludedOutcome', () => {
  it('excludes the outcomes that say nothing about the subject', () => {
    expect(isExcludedOutcome('error')).toBe(true);
    expect(isExcludedOutcome('timeout')).toBe(true);
    expect(isExcludedOutcome('skipped')).toBe(true);
    expect(isExcludedOutcome('pass')).toBe(false);
    expect(isExcludedOutcome('fail')).toBe(false);
  });
});
