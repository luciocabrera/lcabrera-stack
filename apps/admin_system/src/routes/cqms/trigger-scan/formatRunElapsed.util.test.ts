import { describe, expect, it } from 'vitest';

import { formatRunElapsed } from './formatRunElapsed.util';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

describe('formatRunElapsed', () => {
  it('reports under a minute as "less than a minute"', () => {
    expect(formatRunElapsed({ nowMs: 30_000, startedAtMs: 0 })).toBe(
      'less than a minute',
    );
  });

  it('reports whole minutes', () => {
    expect(formatRunElapsed({ nowMs: 5 * MINUTE, startedAtMs: 0 })).toBe('5m');
  });

  it('rounds down partial minutes', () => {
    expect(formatRunElapsed({ nowMs: 90_000, startedAtMs: 0 })).toBe('1m');
  });

  it('reports hours and minutes past an hour', () => {
    expect(formatRunElapsed({ nowMs: HOUR + 5 * MINUTE, startedAtMs: 0 })).toBe(
      '1h 5m',
    );
  });

  it('clamps a negative delta (clock skew) to "less than a minute"', () => {
    expect(formatRunElapsed({ nowMs: 0, startedAtMs: 10 * MINUTE })).toBe(
      'less than a minute',
    );
  });
});
