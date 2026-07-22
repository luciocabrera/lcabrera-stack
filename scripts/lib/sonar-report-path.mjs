/**
 * Where a SonarCloud run's snapshot is written.
 *
 * Why this is not one constant: `reports/sonar/full-latest.json` is TRACKED, and
 * AGENTS.md points agents at it as `main`'s state — they are told to act on
 * Sonar from this file rather than the dashboard. Every run used to write there,
 * including `--pr <n>`, which is not an occasional flag: SonarCloud runs here in
 * Automatic Analysis mode, feature branches are analysed as pull requests, and a
 * `branch=<feature>` query 404s. So the routine way to read a branch's own
 * findings silently replaced `main`'s snapshot with a pull request's.
 *
 * It happened. PR #283's analysis sat committed as `main`'s for 22 merges,
 * reporting `gate: ERROR` and two findings that `main` did not have — one of
 * them already reviewed and accepted in SonarCloud. An agent read it, reported a
 * failing gate, and started work on code that was correct (#304).
 *
 * The freshness check (`sonar-freshness.mjs`) cannot catch this: it asks whether
 * the analysis is OLD. A pull request's analysis one minute old is perfectly
 * fresh and entirely wrong for this file.
 *
 * So only a `main`-branch analysis is the tracked snapshot; everything else is a
 * per-run artifact under `runs/`, gitignored exactly like `reports/fallow/runs/`.
 *
 * Pure by design — the caller owns the filesystem.
 */

/** The tracked snapshot. `sonar-report-path.test.mjs` pins its scope to `main`. */
export const TRACKED_REPORT_PATH = 'reports/sonar/full-latest.json';

/** Per-run artifacts, gitignored. Sibling of the fallow convention. */
export const RUNS_DIRECTORY = 'reports/sonar/runs';

/** A branch name is not a filename: `fix/304-x` would open a directory. Only
 *  `[a-z0-9-]` survives — a run of anything else becomes a single `-`. `.` is
 *  excluded deliberately, so no segment can ever spell `..`; the cost is that
 *  `release-v0.1.1` reads as `release-v0-1-1`, which is no less legible.
 *
 *  Split/filter/join rather than a replace and a `/^-+|-+$/` trim: that trim is
 *  super-linear on a long run of separators (Sonar S8786), and splitting drops
 *  the leading and trailing ones for free. */
const asFileSegment = (value) =>
  String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part !== '')
    .join('-');

/**
 * The repo-relative path a run targeting `target` writes to.
 *
 * Only `{ type: 'branch', value: <mainBranch> }` earns the tracked path. A
 * pull request, or any other branch, gets its own file — so reading one can
 * never be mistaken for reading `main`, and writing one cannot destroy it.
 */
export const reportPathFor = (target, mainBranch = 'main') => {
  if (target?.type === 'branch' && target.value === mainBranch) {
    return TRACKED_REPORT_PATH;
  }
  const prefix = target?.type === 'pullRequest' ? 'pr' : 'branch';
  const segment = asFileSegment(target?.value ?? 'unknown') || 'unknown';
  return `${RUNS_DIRECTORY}/${prefix}-${segment}.json`;
};

/** Whether a parsed snapshot describes the tracked scope. The guard reads this
 *  rather than trusting the filename, which is what went wrong. */
export const isMainSnapshot = (report, mainBranch = 'main') =>
  report?.target?.type === 'branch' && report.target.value === mainBranch;
