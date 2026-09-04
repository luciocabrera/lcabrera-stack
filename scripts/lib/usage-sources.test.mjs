/*
 * The two remote-ish sources fail in the way that is hardest to notice: an
 * unauthenticated `gh` and a workflow nobody triggered both yield nothing. These
 * checks pin that the reader distinguishes them, and never turns "could not
 * read" into a number.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  isShallowClone,
  parseCommitFiles,
  readRegisterActivity,
  readWorkflowRuns,
  tallyFiles,
} from './usage-sources.mjs';

const MARK = String.fromCodePoint(1);

const LOG = [
  `${MARK}aaa 2026-09-04`,
  'docs/coordination/tasks/one.md',
  'docs/coordination/tasks/two.md',
  `${MARK}bbb 2026-08-30`,
  'docs/coordination/tasks/one.md',
].join('\n');

describe('readWorkflowRuns', () => {
  it('says the API could not be read instead of reporting no runs', () => {
    const result = readWorkflowRuns({
      runGh: () => {
        throw new Error('gh api failed: gh auth login required');
      },
      since: '2026-06-07',
      workflows: ['check-safe.yml'],
    });

    expect(result.available).toBe(false);
    expect(result.reason).toContain('gh auth login required');
    expect(result.runs).toEqual({});
  });

  it('reports a run total per workflow when the API answers', () => {
    const result = readWorkflowRuns({
      runGh: (args) =>
        args[1] === 'repos/{owner}/{repo}' ? 'owner/repo' : '12',
      since: '2026-06-07',
      workflows: ['check-safe.yml'],
    });

    expect(result).toEqual({
      available: true,
      runs: { 'check-safe.yml': { count: 12 } },
    });
  });

  it('carries a reason for the one workflow it could not read', () => {
    const result = readWorkflowRuns({
      runGh: (args) => {
        if (args[1] === 'repos/{owner}/{repo}') return 'owner/repo';
        throw new Error('HTTP 404');
      },
      since: '2026-06-07',
      workflows: ['retired.yml'],
    });

    expect(result.runs['retired.yml'].count).toBeUndefined();
    expect(result.runs['retired.yml'].reason).toContain('404');
  });
});

describe('parseCommitFiles', () => {
  it('splits the log into commits with their day and files', () => {
    expect(parseCommitFiles(LOG)).toEqual([
      {
        day: '2026-09-04',
        files: [
          'docs/coordination/tasks/one.md',
          'docs/coordination/tasks/two.md',
        ],
      },
      { day: '2026-08-30', files: ['docs/coordination/tasks/one.md'] },
    ]);
  });
});

describe('tallyFiles', () => {
  it('counts commits per file and keeps the most recent day', () => {
    expect(tallyFiles(parseCommitFiles(LOG))).toEqual({
      'docs/coordination/tasks/one.md': {
        commits: 2,
        lastTouched: '2026-09-04',
      },
      'docs/coordination/tasks/two.md': {
        commits: 1,
        lastTouched: '2026-09-04',
      },
    });
  });
});

describe('readRegisterActivity', () => {
  it('says git could not be read instead of reporting no commits', () => {
    const result = readRegisterActivity({
      cwd: '/repo',
      directory: 'docs/product/requirements',
      runGit: () => undefined,
      sinceDay: '2026-06-07',
    });

    expect(result.available).toBe(false);
    expect(result.reason).toContain('could not be read');
  });

  it('reports an empty register as read with nothing in the window', () => {
    const result = readRegisterActivity({
      cwd: '/repo',
      directory: 'docs/product/requirements',
      runGit: () => '',
      sinceDay: '2026-06-07',
    });

    expect(result).toMatchObject({ available: true, commits: 0, files: {} });
  });
});

describe('isShallowClone', () => {
  it('is true only when git says so', () => {
    expect(isShallowClone({ cwd: '/repo', runGit: () => 'true' })).toBe(true);
    expect(isShallowClone({ cwd: '/repo', runGit: () => 'false' })).toBe(false);
    expect(isShallowClone({ cwd: '/repo', runGit: () => undefined })).toBe(
      false,
    );
  });
});
