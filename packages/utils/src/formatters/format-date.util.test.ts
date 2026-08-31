import { describe, expect, it } from 'vite-plus/test';

import { formatDate } from './format-date.util';

describe('formatDate', () => {
  it('formats a Date object', () => {
    const d = new Date('2024-01-15');
    const result = formatDate({ value: d });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats an ISO date string', () => {
    const result = formatDate({
      locale: 'en-US',
      preset: 'short',
      value: '2024-01-15',
    });
    expect(result).toBeTruthy();
  });

  it('returns original string for invalid date string', () => {
    const result = formatDate({ value: 'not-a-date' });
    expect(result).toBe('not-a-date');
  });

  it('returns empty string for non-string invalid value', () => {
    const result = formatDate({ value: undefined });
    expect(result).toBe('');
  });

  it('formats with different presets', () => {
    const d = new Date('2024-06-15');
    const short = formatDate({ locale: 'en-US', preset: 'short', value: d });
    const full = formatDate({ locale: 'en-US', preset: 'full', value: d });
    expect(full.length).toBeGreaterThan(short.length);
  });

  it('formats with numeric timestamp', () => {
    const ts = new Date('2024-01-15').getTime();
    const result = formatDate({ value: ts });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('is date-only and unchanged when timeStyle is omitted', () => {
    expect(
      formatDate({ locale: 'en-US', preset: 'medium', value: '2024-01-15' }),
    ).toBe('Jan 15, 2024');
  });

  it('appends the time of day when timeStyle is given', () => {
    expect(
      formatDate({
        locale: 'en-US',
        preset: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
        value: '2024-01-15T18:30:00Z',
      }),
    ).toBe('Jan 15, 2024, 6:30 PM');
  });

  it('pins the output to the requested time zone', () => {
    const value = '2024-01-15T23:30:00Z';
    const options = {
      locale: 'en-US',
      preset: 'medium',
      timeStyle: 'short',
      value,
    } as const;

    expect(formatDate({ ...options, timeZone: 'UTC' })).toBe(
      'Jan 15, 2024, 11:30 PM',
    );
    expect(formatDate({ ...options, timeZone: 'America/New_York' })).toBe(
      'Jan 15, 2024, 6:30 PM',
    );
    expect(formatDate({ ...options, timeZone: 'Asia/Tokyo' })).toBe(
      'Jan 16, 2024, 8:30 AM',
    );
  });

  it('falls back to the ISO instant when a requested zone is invalid', () => {
    expect(
      formatDate({ timeZone: 'Not/AZone', value: '2024-01-15T23:30:00Z' }),
    ).toBe('2024-01-15T23:30:00.000Z');
  });
});
