import { describe, expect, it } from 'vite-plus/test';

import { getXTicks } from './getXTicks.util';

describe('getXTicks', () => {
  it('picks nice ticks across a number domain', () => {
    expect(getXTicks({ domain: [0, 10], isTime: false })).toEqual([
      0, 2, 4, 6, 8, 10,
    ]);
  });

  it('places whole UTC days on a time domain of a day or more', () => {
    const day = 86_400_000;
    const ticks = getXTicks({
      domain: [day * 10 + 3600, day * 13],
      isTime: true,
    });

    expect(ticks.every((tick) => tick instanceof Date)).toBe(true);
    expect(ticks.map(Number)).toEqual([day * 11, day * 12, day * 13]);
  });

  it('places nice instants on a time domain shorter than a day', () => {
    expect(getXTicks({ domain: [0, 1000], isTime: true }).map(Number)).toEqual([
      0, 200, 400, 600, 800, 1000,
    ]);
  });

  it('measures the span of a late time domain, not its position', () => {
    const day = 86_400_000;

    expect(
      getXTicks({ domain: [day * 10, day * 10 + 1000], isTime: true }).map(
        Number,
      ),
    ).toEqual([0, 200, 400, 600, 800, 1000].map((ms) => day * 10 + ms));
  });

  it('places no tick between two whole milliseconds', () => {
    expect(getXTicks({ domain: [0, 1], isTime: true }).map(Number)).toEqual([
      0, 1,
    ]);
  });

  it('places one date on a time domain of a single instant', () => {
    expect(getXTicks({ domain: [7, 7], isTime: true })).toEqual([new Date(7)]);
  });

  it('switches to days at exactly one day', () => {
    const day = 86_400_000;

    expect(getXTicks({ domain: [0, day], isTime: true }).map(Number)).toEqual([
      0,
      day,
    ]);
  });

  it('keeps the ticks it is given', () => {
    const ticks = [new Date(1)];

    expect(getXTicks({ domain: [0, 2], isTime: true, ticks })).toBe(ticks);
  });
});
