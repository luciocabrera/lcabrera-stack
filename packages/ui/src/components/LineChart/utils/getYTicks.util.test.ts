import { describe, expect, it } from 'vite-plus/test';

import { getYTicks } from './getYTicks.util';

describe('getYTicks', () => {
  it('picks nice ticks across the domain', () => {
    expect(getYTicks({ domain: [0, 100] })).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it('picks fewer ticks for a smaller count', () => {
    expect(getYTicks({ domain: [0, 100], tickCount: 3 })).toEqual([0, 50, 100]);
  });

  it('keeps the ticks it is given', () => {
    expect(getYTicks({ domain: [0, 100], ticks: [0, 50] })).toEqual([0, 50]);
  });
});
