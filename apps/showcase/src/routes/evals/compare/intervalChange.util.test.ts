import { describe, expect, it } from 'vite-plus/test';

import { intervalChange } from './intervalChange.util';

describe('intervalChange', () => {
  it('tells an interval wholly below from one wholly above', () => {
    expect(
      intervalChange({
        a: { lower: 0.6, upper: 0.9 },
        b: { lower: 0.1, upper: 0.5 },
      }),
    ).toBe('B is below A');
    expect(
      intervalChange({
        a: { lower: 0.1, upper: 0.5 },
        b: { lower: 0.6, upper: 0.9 },
      }),
    ).toBe('B is above A');
  });

  it('calls intervals that share any point overlapping', () => {
    expect(
      intervalChange({
        a: { lower: 0.1, upper: 0.5 },
        b: { lower: 0.5, upper: 0.9 },
      }),
    ).toBe('overlapping');
  });

  it('refuses to compare when either side has no interval', () => {
    expect(
      intervalChange({
        a: { lower: 0.1, upper: 0.5 },
        b: { lower: undefined, upper: undefined },
      }),
    ).toBe('too few trials to compare');
  });
});
