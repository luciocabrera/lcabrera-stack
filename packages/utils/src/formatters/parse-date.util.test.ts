import { describe, expect, it } from 'vite-plus/test';

import { parseDate } from './parse-date.util';

describe('parseDate', () => {
  it('returns the same Date object when passed a Date', () => {
    const d = new Date('2024-01-15');
    expect(parseDate(d)).toBe(d);
  });

  it('parses an ISO date string', () => {
    const result = parseDate('2024-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
  });

  it('parses a numeric timestamp', () => {
    const ts = new Date('2024-01-15').getTime();
    const result = parseDate(ts);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(ts);
  });

  it('returns undefined for invalid string', () => {
    expect(parseDate('not-a-date')).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(parseDate(undefined)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(parseDate(undefined)).toBeUndefined();
  });

  it('returns undefined for object', () => {
    expect(parseDate({})).toBeUndefined();
  });

  it('returns undefined for boolean', () => {
    expect(parseDate(true)).toBeUndefined();
  });
});
