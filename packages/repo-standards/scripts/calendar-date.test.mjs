import { describe, expect, it } from 'vite-plus/test';

import { isCalendarDate } from './calendar-date.mjs';

describe('isCalendarDate', () => {
  it.each(['2027-04-29', '2028-02-29'])('accepts %s', (value) => {
    expect(isCalendarDate(value)).toBe(true);
  });

  it.each([
    'never',
    '',
    '2027-02-30',
    '2027-13-01',
    '2027-4-29',
    '2027-04-29T00:00:00Z',
    ' 2027-04-29',
    20_270_429,
    undefined,
    null,
  ])('refuses %j', (value) => {
    expect(isCalendarDate(value)).toBe(false);
  });
});
