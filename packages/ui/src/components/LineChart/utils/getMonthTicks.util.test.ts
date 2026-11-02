import { describe, expect, it } from 'vite-plus/test';

import { getMonthTicks } from './getMonthTicks.util';

const days = ({
  end,
  start,
}: {
  readonly end: string;
  readonly start: string;
}) =>
  getMonthTicks({ end: Date.parse(end), start: Date.parse(start) })?.map(
    (tick) => tick.toISOString().slice(0, 10),
  );

describe('getMonthTicks', () => {
  it('keeps a start that falls on a month start', () => {
    expect(
      days({ end: '2026-08-01T00:00:00Z', start: '2026-01-01T00:00:00Z' }),
    ).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
      '2026-04-01',
      '2026-05-01',
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
    ]);
  });

  it('starts after a start inside a month, on a month the step divides', () => {
    expect(
      days({ end: '2027-01-15T00:00:00Z', start: '2026-01-15T00:00:00Z' }),
    ).toEqual([
      '2026-03-01',
      '2026-05-01',
      '2026-07-01',
      '2026-09-01',
      '2026-11-01',
      '2027-01-01',
    ]);
  });

  it('has no ticks for a span too long for any month step', () => {
    expect(
      days({ end: '2020-01-01T00:00:00Z', start: '2000-01-01T00:00:00Z' }),
    ).toBeUndefined();
  });
});
