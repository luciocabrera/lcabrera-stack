import { describe, expect, it } from 'vite-plus/test';

import { isFlip } from './isFlip.util.ts';

describe('isFlip', () => {
  it('counts a task only one run has', () => {
    expect(isFlip({ after: undefined, before: ['pass'] })).toBe(true);
    expect(isFlip({ after: ['pass'], before: undefined })).toBe(true);
  });

  it('counts a task that stopped passing every trial', () => {
    expect(isFlip({ after: ['pass', 'fail'], before: ['pass', 'pass'] })).toBe(
      true,
    );
  });

  it('counts a task that went from no pass to some', () => {
    expect(isFlip({ after: ['fail', 'pass'], before: ['fail', 'fail'] })).toBe(
      true,
    );
  });

  it('ignores a task whose pass-at-k and pass-hat-k held', () => {
    expect(isFlip({ after: ['pass', 'fail'], before: ['fail', 'pass'] })).toBe(
      false,
    );
  });
});
