import { describe, expect, it } from 'vitest';

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
});
