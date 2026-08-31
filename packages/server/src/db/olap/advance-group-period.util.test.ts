import { describe, expect, it } from 'vite-plus/test';

import { advanceGroupPeriod } from './advance-group-period.util.ts';

type CalendarArgs = {
  readonly day?: number;
  readonly month: number;
  readonly year: number;
};

const local = ({ day = 1, month, year }: CalendarArgs) =>
  new Date(year, month - 1, day);

const utc = ({ day = 1, month, year }: CalendarArgs) =>
  new Date(Date.UTC(year, month - 1, day));

describe('advanceGroupPeriod', () => {
  it('adds a calendar month, not a fixed number of days', () => {
    expect(
      advanceGroupPeriod({
        isZoned: false,
        period: 'month',
        start: local({ month: 2, year: 2021 }),
      }),
    ).toStrictEqual(local({ month: 3, year: 2021 }));
  });

  it('normalises across a year boundary', () => {
    expect(
      advanceGroupPeriod({
        isZoned: false,
        period: 'month',
        start: local({ month: 12, year: 2021 }),
      }),
    ).toStrictEqual(local({ month: 1, year: 2022 }));
    expect(
      advanceGroupPeriod({
        isZoned: false,
        period: 'quarter',
        start: local({ month: 10, year: 2021 }),
      }),
    ).toStrictEqual(local({ month: 1, year: 2022 }));
  });

  it('advances a year across a leap year', () => {
    expect(
      advanceGroupPeriod({
        isZoned: false,
        period: 'year',
        start: local({ month: 1, year: 2024 }),
      }),
    ).toStrictEqual(local({ month: 1, year: 2025 }));
  });

  it('advances a day', () => {
    expect(
      advanceGroupPeriod({
        isZoned: false,
        period: 'day',
        start: local({ day: 28, month: 2, year: 2021 }),
      }),
    ).toStrictEqual(local({ day: 1, month: 3, year: 2021 }));
  });

  it('reads a zoned value in UTC and an unzoned one locally', () => {
    const zoned = advanceGroupPeriod({
      isZoned: true,
      period: 'month',
      start: utc({ month: 1, year: 2021 }),
    });
    const unzoned = advanceGroupPeriod({
      isZoned: false,
      period: 'month',
      start: local({ month: 1, year: 2021 }),
    });

    expect(zoned.getUTCMonth()).toBe(1);
    expect(zoned.getUTCFullYear()).toBe(2021);
    expect(unzoned.getMonth()).toBe(1);
    expect(unzoned.getFullYear()).toBe(2021);
  });

  it('never mutates the value it was handed', () => {
    const start = local({ month: 6, year: 2021 });

    advanceGroupPeriod({ isZoned: false, period: 'year', start });

    expect(start).toStrictEqual(local({ month: 6, year: 2021 }));
  });
});
