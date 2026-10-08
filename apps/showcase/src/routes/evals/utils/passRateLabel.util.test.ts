import { describe, expect, it } from 'vite-plus/test';

import { passRateLabel } from './passRateLabel.util';

describe('passRateLabel', () => {
  it('writes the rate with the counts it came from', () => {
    expect(passRateLabel({ k: 2, n: 3, rate: 2 / 3 })).toBe('67% (2/3)');
  });

  it('says when nothing was scored', () => {
    expect(passRateLabel({ k: 0, n: 0, rate: undefined })).toBe(
      'no scored trials',
    );
  });
});
