import { describe, expect, it } from 'vite-plus/test';

import { formatSharePercent } from './formatSharePercent.util';

describe('formatSharePercent', () => {
  it('formats a ratio as a percentage to one decimal place', () => {
    expect(formatSharePercent({ locale: 'en-US', ratio: 0.25 })).toBe('25.0%');
  });

  it('honours the table locale', () => {
    expect(formatSharePercent({ locale: 'de-DE', ratio: 0.255 })).toBe(
      '25,5 %',
    );
  });

  it('returns the same formatter output across calls', () => {
    expect(formatSharePercent({ locale: 'en-US', ratio: 0.5 })).toBe('50.0%');
    expect(formatSharePercent({ locale: 'de-DE', ratio: 0.5 })).toBe('50,0 %');
    expect(formatSharePercent({ locale: 'en-US', ratio: 0.5 })).toBe('50.0%');
  });

  it('treats an absent locale as its own key', () => {
    expect(formatSharePercent({ locale: undefined, ratio: 1 })).toContain(
      '100',
    );
  });
});
