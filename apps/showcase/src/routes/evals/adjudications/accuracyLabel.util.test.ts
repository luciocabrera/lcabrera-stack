import { describe, expect, it } from 'vite-plus/test';

import { accuracyLabel } from './accuracyLabel.util';

describe('accuracyLabel', () => {
  it('rounds the share to a whole percent and gives the counts', () => {
    expect(accuracyLabel({ correct: 2, scored: 3 })).toBe('67% (2/3)');
    expect(accuracyLabel({ correct: 0, scored: 1 })).toBe('0% (0/1)');
  });

  it('says there is no true answer yet when nothing was scored', () => {
    expect(accuracyLabel({ correct: 0, scored: 0 })).toBe('no true answer yet');
  });
});
