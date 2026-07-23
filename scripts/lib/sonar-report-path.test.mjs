import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  isMainSnapshot,
  RUNS_DIRECTORY,
  reportPathFor,
  TRACKED_REPORT_PATH,
} from './sonar-report-path.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const trackedSnapshot = () =>
  JSON.parse(readFileSync(join(REPO_ROOT, TRACKED_REPORT_PATH), 'utf8'));

describe('reportPathFor', () => {
  it('gives a main-branch analysis the tracked path', () => {
    expect(reportPathFor({ type: 'branch', value: 'main' })).toBe(
      TRACKED_REPORT_PATH,
    );
  });

  it('keeps a pull request out of the tracked path', () => {
    const path = reportPathFor({ type: 'pullRequest', value: '283' });
    expect(path).toBe(`${RUNS_DIRECTORY}/pr-283.json`);
    expect(path).not.toBe(TRACKED_REPORT_PATH);
  });

  it('keeps a non-main branch out of the tracked path', () => {
    expect(reportPathFor({ type: 'branch', value: 'release-v0-1-1' })).toBe(
      `${RUNS_DIRECTORY}/branch-release-v0-1-1.json`,
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

  it('honours a configured main branch rather than the literal "main"', () => {
    expect(reportPathFor({ type: 'branch', value: 'trunk' }, 'trunk')).toBe(
      TRACKED_REPORT_PATH,
    );
    expect(reportPathFor({ type: 'branch', value: 'main' }, 'trunk')).toBe(
      `${RUNS_DIRECTORY}/branch-main.json`,
    );
  });

  it('never returns the tracked path for a malformed target', () => {
    for (const target of [undefined, {}, { type: 'branch' }, { value: 'main' }])
      expect(reportPathFor(target)).not.toBe(TRACKED_REPORT_PATH);
  });
});

describe('the committed snapshot', () => {
  // The guard this file exists for. PR #283's analysis was committed here and
  // read as `main`'s for 22 merges — it reported `gate: ERROR` and two findings
  // `main` did not have, and an agent started work on code that was correct.
  // Nothing objected: not the hook, not check:safe, not CI.
  //
  // Asserts the snapshot's own `target`, never the filename. Trusting the
  // filename is precisely what failed.
  it('describes branch main, not a pull request', () => {
    const snapshot = trackedSnapshot();
    expect(
      snapshot.target,
      `${TRACKED_REPORT_PATH} must be a \`main\` analysis — re-run \`vp run sonar:report -- --branch main\`. A --pr run belongs in ${RUNS_DIRECTORY}/.`,
    ).toEqual({ type: 'branch', value: 'main' });
    expect(isMainSnapshot(snapshot)).toBe(true);
  });

  it('rejects the pull-request snapshot that caused this', () => {
    // The exact shape that was committed. Pinning the negative proves the
    // assertion above discriminates, rather than passing on anything.
    expect(
      isMainSnapshot({ target: { type: 'pullRequest', value: '283' } }),
    ).toBe(false);
  });
});
