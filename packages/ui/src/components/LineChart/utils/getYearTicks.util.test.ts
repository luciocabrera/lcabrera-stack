import { describe, expect, it } from 'vite-plus/test';

import { getYearTicks } from './getYearTicks.util';

const yearStart = (year: number) => new Date(Date.UTC(year, 0, 1));

describe('getYearTicks', () => {
  it('keeps a start that falls on a year start', () => {
    expect(
      getYearTicks({ end: Date.UTC(2020, 5, 1), start: Date.UTC(2000, 0, 1) }),
    ).toEqual([2000, 2005, 2010, 2015, 2020].map((year) => yearStart(year)));
  });

  it('starts at the next year after a start inside January', () => {
    expect(
      getYearTicks({ end: Date.UTC(2021, 0, 1), start: Date.UTC(2000, 0, 15) }),
    ).toEqual([2005, 2010, 2015, 2020].map((year) => yearStart(year)));
  });

  it('starts at the next year after a start later in the year', () => {
    expect(
      getYearTicks({ end: Date.UTC(2009, 0, 1), start: Date.UTC(2000, 5, 1) }),
    ).toEqual([2002, 2004, 2006, 2008].map((year) => yearStart(year)));
  });
});
