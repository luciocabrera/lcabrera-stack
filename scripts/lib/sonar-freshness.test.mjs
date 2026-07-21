import { describe, expect, it } from 'vitest';

import {
  analysisAgeMs,
  DEFAULT_STALE_HOURS,
  formatAge,
  freshnessLine,
  isStale,
} from './sonar-freshness.mjs';

// The case these assertions exist for: on 2026-07-21 `sonar:report` printed
// `quality gate: OK` from an analysis that had run on 2026-07-11, because
// SonarCloud had been rejecting analyses for ten days. Nothing in the output
// distinguished that from a fresh pass. The most important assertions here are
// therefore the ones about an UNKNOWN age — "we could not tell" must never
// render as "fine".

const NOW = Date.parse('2026-07-21T12:00:00Z');
const ago = (ms) => new Date(NOW - ms).toISOString();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('analysisAgeMs', () => {
  it('measures the gap to now', () => {
    expect(analysisAgeMs(ago(3 * HOUR), NOW)).toBe(3 * HOUR);
  });

  it('returns null for a missing or unparseable date', () => {
    expect(analysisAgeMs(undefined, NOW)).toBeNull();
    expect(analysisAgeMs('', NOW)).toBeNull();
    expect(analysisAgeMs('not-a-date', NOW)).toBeNull();
  });

  it('clamps a future analysis to zero rather than a negative age', () => {
    // Clock skew between the runner and SonarCloud would otherwise render as
    // "-5 minutes ago", which reads as a bug in the tool rather than the clock.
    expect(analysisAgeMs(new Date(NOW + 5 * MINUTE).toISOString(), NOW)).toBe(
      0,
    );
  });
});

describe('formatAge', () => {
  it('scales the unit to the magnitude', () => {
    expect(formatAge(30_000)).toBe('just now');
    expect(formatAge(5 * MINUTE)).toBe('5 minutes ago');
    expect(formatAge(3 * HOUR)).toBe('3 hours ago');
    expect(formatAge(10 * DAY)).toBe('10 days ago');
  });

  it('singularises', () => {
    expect(formatAge(MINUTE)).toBe('1 minute ago');
    expect(formatAge(HOUR)).toBe('1 hour ago');
    expect(formatAge(DAY)).toBe('1 day ago');
  });

  it('says unknown rather than inventing a duration', () => {
    expect(formatAge(null)).toBe('unknown');
  });
});

describe('isStale', () => {
  it('is false inside the window and true outside it', () => {
    expect(isStale(HOUR)).toBe(false);
    expect(isStale(10 * DAY)).toBe(true);
  });

  it('honours a custom window', () => {
    expect(isStale(3 * HOUR, 1)).toBe(true);
    expect(isStale(3 * HOUR, 6)).toBe(false);
  });

  it('treats an unknown age as stale', () => {
    // The load-bearing one: an unknown age must not be reported as fresh.
    expect(isStale(null)).toBe(true);
    expect(isStale(null, 9999)).toBe(true);
  });

  it('defaults to a 24-hour window', () => {
    expect(DEFAULT_STALE_HOURS).toBe(24);
    expect(isStale(23 * HOUR)).toBe(false);
    expect(isStale(25 * HOUR)).toBe(true);
  });
});

describe('freshnessLine', () => {
  it('reports a fresh analysis without flagging it', () => {
    const { line, stale } = freshnessLine(ago(2 * HOUR), NOW);
    expect(stale).toBe(false);
    expect(line).toContain('2 hours ago');
  });

  it('flags the ten-day case that motivated this', () => {
    const { line, stale } = freshnessLine('2026-07-11T11:02:07+0000', NOW);
    expect(stale).toBe(true);
    expect(line).toContain('10 days ago');
  });

  it('flags a missing date and says the findings are unverified', () => {
    const { ageMs, line, stale } = freshnessLine(undefined, NOW);
    expect(ageMs).toBeNull();
    expect(stale).toBe(true);
    expect(line).toContain('never');
    expect(line).toContain('unverified');
  });
});
