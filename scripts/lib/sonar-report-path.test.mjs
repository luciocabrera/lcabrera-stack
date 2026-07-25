/**
 * What is left to test once no snapshot is tracked: that every target gets its
 * own file, so no run can overwrite another's, and that a branch name can never
 * escape the runs directory.
 *
 * The tests this file used to carry — "a main analysis earns the tracked path",
 * "the committed snapshot describes branch main" — are gone with the tracked
 * path itself. They guarded a pull request's analysis being read as `main`'s,
 * which is now impossible rather than checked.
 */
import { describe, expect, it } from 'vite-plus/test';

import { RUNS_DIRECTORY, reportPathFor } from './sonar-report-path.mjs';

describe('reportPathFor', () => {
  it('gives every target its own file, so no run overwrites another', () => {
    const paths = [
      reportPathFor({ type: 'branch', value: 'main' }),
      reportPathFor({ type: 'pullRequest', value: '283' }),
      reportPathFor({ type: 'branch', value: 'release-v0-1-1' }),
    ];

    expect(paths).toEqual([
      `${RUNS_DIRECTORY}/branch-main.json`,
      `${RUNS_DIRECTORY}/pr-283.json`,
      `${RUNS_DIRECTORY}/branch-release-v0-1-1.json`,
    ]);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('distinguishes a pull request from a branch of the same name', () => {
    expect(reportPathFor({ type: 'pullRequest', value: '283' })).not.toBe(
      reportPathFor({ type: 'branch', value: '283' }),
    );
  });

  it('makes a branch name safe to use as a filename', () => {
    // `fix/304-x` unescaped would open a directory that does not exist.
    expect(reportPathFor({ type: 'branch', value: 'fix/304-Snapshot' })).toBe(
      `${RUNS_DIRECTORY}/branch-fix-304-snapshot.json`,
    );
  });

  it('cannot be walked out of the runs directory', () => {
    // Not a likely attack — a branch name reaches this from `.git/HEAD` — but a
    // path built from an outside name should not depend on that to be safe.
    for (const value of ['../../etc/passwd', '..', './../x']) {
      const path = reportPathFor({ type: 'branch', value });
      expect(path.startsWith(`${RUNS_DIRECTORY}/`)).toBe(true);
      expect(path).not.toMatch(/\.\./);
    }
  });

  it('still lands inside the runs directory for a malformed target', () => {
    // A missing value becomes `unknown`; a value with no type takes the default
    // `branch` prefix. Neither can escape the runs directory, which is the only
    // property that matters now that nothing is tracked — under the old tracked
    // path a malformed target had to be kept away from `main`'s snapshot.
    for (const target of [undefined, {}, { type: 'branch' }]) {
      expect(reportPathFor(target)).toBe(
        `${RUNS_DIRECTORY}/branch-unknown.json`,
      );
    }
    expect(reportPathFor({ value: 'main' })).toBe(
      `${RUNS_DIRECTORY}/branch-main.json`,
    );
  });
});
