import { describe, expect, it } from 'vite-plus/test';

import { getXTicks } from './getXTicks.util';

const HOUR = 3_600_000;

describe('getXTicks', () => {
  it('picks nice ticks across a number domain', () => {
    expect(getXTicks({ domain: [0, 10], isTime: false })).toEqual([
      0, 2, 4, 6, 8, 10,
    ]);
  });

  it('picks time ticks across a time domain', () => {
    expect(getXTicks({ domain: [0, 2 * HOUR], isTime: true })).toEqual([
      new Date(0),
      new Date(HOUR / 2),
      new Date(HOUR),
      new Date(1.5 * HOUR),
      new Date(2 * HOUR),
    ]);
  });

  it('picks more ticks across a number domain for a larger count', () => {
    expect(
      getXTicks({ domain: [0, 100], isTime: false, tickCount: 8 }).length,
    ).toBeGreaterThan(getXTicks({ domain: [0, 100], isTime: false }).length);
  });

  it('keeps the ticks it is given', () => {
    const ticks = [new Date(1)];

    expect(getXTicks({ domain: [0, 2], isTime: true, ticks })).toBe(ticks);
  });
});
