import { describe, expect, it } from 'vite-plus/test';

import { accuracyIntervalLabel } from './accuracyIntervalLabel.util';

describe('accuracyIntervalLabel', () => {
  it('gives the Wilson interval once enough verdicts are scored', () => {
    expect(accuracyIntervalLabel({ correct: 6, scored: 8 })).toBe('41% to 93%');
  });

  it('says there are too few verdicts below the minimum', () => {
    expect(accuracyIntervalLabel({ correct: 2, scored: 3 })).toBe(
      'too few verdicts for an interval',
    );
  });
});
