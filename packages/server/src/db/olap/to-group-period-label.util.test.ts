import { describe, expect, it } from 'vite-plus/test';

import { toGroupPeriodLabel } from './to-group-period-label.util.ts';

type CalendarArgs = {
  readonly day?: number;
  readonly month: number;
  readonly year: number;
};

const local = ({ day = 1, month, year }: CalendarArgs) =>
  new Date(year, month - 1, day);

describe('toGroupPeriodLabel', () => {
  it('heads each period by what distinguishes it', () => {
    const start = local({ day: 14, month: 6, year: 2021 });

    expect(
      toGroupPeriodLabel({ isZoned: false, period: 'year', value: start }),
    ).toBe('2021');
    expect(
      toGroupPeriodLabel({ isZoned: false, period: 'quarter', value: start }),
    ).toBe('2021-Q2');
    expect(
      toGroupPeriodLabel({ isZoned: false, period: 'month', value: start }),
    ).toBe('2021-06');
    expect(
      toGroupPeriodLabel({ isZoned: false, period: 'day', value: start }),
    ).toBe('2021-06-14');
  });

  it('numbers quarters from the month, at both ends', () => {
    expect(
      toGroupPeriodLabel({
        isZoned: false,
        period: 'quarter',
        value: local({ month: 1, year: 2021 }),
      }),
    ).toBe('2021-Q1');
    expect(
      toGroupPeriodLabel({
        isZoned: false,
        period: 'quarter',
        value: local({ month: 12, year: 2021 }),
      }),
    ).toBe('2021-Q4');
  });

  it('reads an unzoned value in the frame it was written in', () => {
    // The defect this exists to prevent: a January group whose `toISOString()`
    // is the previous December under any positive UTC offset, so an ISO heading
    // names the wrong month. Constructed from local fields, read back from
    // local fields.
    expect(
      toGroupPeriodLabel({
        isZoned: false,
        period: 'month',
        value: local({ month: 1, year: 2021 }),
      }),
    ).toBe('2021-01');
  });

  it('reads a zoned value in UTC, which is where it was truncated', () => {
    expect(
      toGroupPeriodLabel({
        isZoned: true,
        period: 'month',
        value: new Date('2021-01-01T00:00:00.000Z'),
      }),
    ).toBe('2021-01');
  });

  it('pads a year below four digits rather than shortening the heading', () => {
    // `Date.UTC` maps 0–99 onto 1900–1999, so the year is set explicitly.
    const ancient = new Date(Date.UTC(2000, 2, 1));

    ancient.setUTCFullYear(7);

    expect(
      toGroupPeriodLabel({ isZoned: true, period: 'month', value: ancient }),
    ).toBe('0007-03');
  });

  it('answers nothing for a value that is not a date, so the caller can fall back', () => {
    expect(
      toGroupPeriodLabel({ isZoned: false, period: 'month', value: 'March' }),
    ).toBeUndefined();
    expect(
      toGroupPeriodLabel({
        isZoned: false,
        period: 'month',
        value: JSON.parse('null') as unknown,
      }),
    ).toBeUndefined();
    expect(
      toGroupPeriodLabel({
        isZoned: false,
        period: 'month',
        value: new Date('nonsense'),
      }),
    ).toBeUndefined();
  });
});
