/**
 * How old is the SonarCloud analysis a report was built from, and is that old
 * enough to be misleading?
 *
 * Why this exists: `sonar:report` printed a quality gate and an issue count with
 * no indication of when the analysis behind them ran. On 2026-07-21 SonarCloud
 * had been rejecting analyses for ten days (the project was private and the
 * organisation's 50,000-line quota was exhausted), and the command kept
 * reporting `quality gate: OK` from the last analysis that had succeeded — on
 * 2026-07-11. Reading that as current is what a healthy run looks like, so the
 * outage was invisible from the tool that exists to surface it.
 *
 * The CI gate already guards against this with `--since`, refusing an analysis
 * older than the commit under test. The CLI had no equivalent.
 *
 * Pure by design: `now` is a parameter, never `Date.now()`, so every branch is
 * testable and the caller owns the clock.
 */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const DEFAULT_STALE_HOURS = 24;

export const analysisAgeMs = (analysisDate, now) => {
  if (typeof analysisDate !== 'string' || analysisDate === '') return null;
  const parsed = Date.parse(analysisDate);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, now - parsed);
};

export const formatAge = (ageMs) => {
  if (ageMs === null) return 'unknown';
  if (ageMs < MINUTE_MS) return 'just now';
  if (ageMs < HOUR_MS) {
    const minutes = Math.floor(ageMs / MINUTE_MS);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (ageMs < DAY_MS) {
    const hours = Math.floor(ageMs / HOUR_MS);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(ageMs / DAY_MS);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const isStale = (ageMs, maxAgeHours = DEFAULT_STALE_HOURS) =>
  ageMs === null || ageMs > maxAgeHours * HOUR_MS;

export const freshnessLine = (analysisDate, now, maxAgeHours) => {
  const ageMs = analysisAgeMs(analysisDate, now);
  const stale = isStale(ageMs, maxAgeHours);
  const when = analysisDate ?? 'never';
  return {
    ageMs,
    line:
      ageMs === null
        ? `  analysed: ${when} — no analysis date; treat the findings as unverified`
        : `  analysed: ${when} (${formatAge(ageMs)})`,
    stale,
  };
};
