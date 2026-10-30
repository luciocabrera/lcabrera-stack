import { describe, expect, it } from 'vite-plus/test';

import { scaleTime } from './scale-time.util';

const day = (date: number) => new Date(Date.UTC(2026, 0, date));

describe('scaleTime', () => {
  it('maps dates onto the range', () => {
    const scale = scaleTime({ domain: [day(1), day(11)], range: [0, 100] });

    expect([scale(day(1)), scale(day(6)), scale(day(11))]).toEqual([
      0, 50, 100,
    ]);
  });

  it('extrapolates past the domain unless it is clamped', () => {
    const open = scaleTime({ domain: [day(1), day(11)], range: [0, 100] });
    const clamped = scaleTime({
      domain: [day(1), day(11)],
      isClamped: true,
      range: [0, 100],
    });

    expect(open(day(21))).toBe(200);
    expect(clamped(day(21))).toBe(100);
  });
});
