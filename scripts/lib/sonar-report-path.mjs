/**
 * Where a SonarCloud run's snapshot is written: always under `runs/`, one file
 * per target, never tracked.
 *
 * This module used to be a two-way decision, because
 * `reports/sonar/full-latest.json` was tracked and AGENTS.md pointed agents at it
 * as `main`'s state. Every run wrote there, including `--pr <n>` — which is not an
 * occasional flag, since SonarCloud runs here in Automatic Analysis mode and a
 * feature branch is analysed as a pull request. So the routine way to read a
 * branch's findings replaced `main`'s snapshot with a pull request's, and PR
 * #283's analysis sat committed as `main`'s for 22 merges, reporting a failing
 * gate and two findings `main` did not have (#304).
 *
 * Restricting the tracked path to a `main` analysis fixed that instance. It did
 * not fix the class: a committed snapshot is a measurement, and a measurement in
 * git is stale from the moment the next commit lands, with nothing to say so.
 * Nothing regenerated it either — it moved only when someone remembered.
 *
 * So there is no tracked snapshot. A report is produced on demand and read where
 * it lands; `main` is just another target. The failure above is now impossible
 * rather than guarded against, which is why the guard is gone.
 *
 * Pure by design — the caller owns the filesystem.
 */

export const RUNS_DIRECTORY = 'reports/sonar/runs';

const asFileSegment = (value) =>
  String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part !== '')
    .join('-');

export const reportPathFor = (target) => {
  const prefix = target?.type === 'pullRequest' ? 'pr' : 'branch';
  const segment = asFileSegment(target?.value ?? 'unknown') || 'unknown';
  return `${RUNS_DIRECTORY}/${prefix}-${segment}.json`;
};
