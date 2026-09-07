/**
 * One shape for a coverage metric, whatever the reporter wrote.
 *
 * Istanbul's json-summary answers `"pct": "Unknown"` — a string — for a total
 * with nothing in it, which every consumer here then formats with `toFixed`.
 * A workspace whose suite covers no file of its own is a normal state, not a
 * broken run, so the report normalises rather than refusing: an empty total is
 * complete, which is the rule the monorepo aggregate already applies to itself.
 */

export const percentageOf = ({ covered, total }) =>
  total === 0 ? 100 : (covered / total) * 100;

/**
 * @param {{ covered?: number, pct?: unknown, skipped?: number,
 *           total?: number }} metric
 * @returns {{ covered: number, pct: number, skipped: number, total: number }}
 */
export const normaliseMetric = (metric = {}) => {
  const covered = metric.covered ?? 0;
  const total = metric.total ?? 0;
  return {
    covered,
    pct:
      typeof metric.pct === 'number' && Number.isFinite(metric.pct)
        ? metric.pct
        : percentageOf({ covered, total }),
    skipped: metric.skipped ?? 0,
    total,
  };
};
