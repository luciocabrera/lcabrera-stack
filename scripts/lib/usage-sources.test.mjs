/*
 * The two remote-ish sources fail in the way that is hardest to notice: an
 * unauthenticated `gh` and a workflow nobody triggered both yield nothing. These
 * checks pin that the reader distinguishes them, and never turns "could not
 * read" into a number, and that neither one answers with activity from after the
 * window it was handed.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  isShallowClone,
  parseCommitFiles,
  readRegisterActivity,
  readWorkflowRuns,
  tallyFiles,
  withinWindow,
} from './usage-sources.mjs';

const WINDOW = { days: 90, end: '2026-09-01', start: '2026-06-04' };

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
      window: WINDOW,
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
      window: WINDOW,
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
      window: WINDOW,
      workflows: ['retired.yml'],
    });

    expect(result.runs['retired.yml'].count).toBeUndefined();
    expect(result.runs['retired.yml'].reason).toContain('404');
  });

  it('asks the API for a range that ends at the window, not for everything since its start', () => {
    const asked = [];
    readWorkflowRuns({
      runGh: (args) => {
        asked.push(args);
        return args[1] === 'repos/{owner}/{repo}' ? 'owner/repo' : '12';
      },
      window: WINDOW,
      workflows: ['check-safe.yml'],
    });
    const runsQuery = asked.find((args) => args[3]?.includes('/runs'));

    expect(runsQuery).toContain('created=2026-06-04..2026-09-01');
    expect(
      runsQuery.some((argument) => argument.startsWith('created=>=')),
    ).toBe(false);
  });
});

describe('withinWindow', () => {
  it('drops a commit dated after the window it is labelled with', () => {
    expect(
      withinWindow({
        commits: [
          { day: '2026-09-04', files: ['a.md'] },
          { day: '2026-08-30', files: ['b.md'] },
          { day: '2026-06-03', files: ['c.md'] },
        ],
        window: WINDOW,
      }),
    ).toEqual([{ day: '2026-08-30', files: ['b.md'] }]);
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
      window: WINDOW,
    });

    expect(result.available).toBe(false);
    expect(result.reason).toContain('could not be read');
  });

  it('reports an empty register as read with nothing in the window', () => {
    const result = readRegisterActivity({
      cwd: '/repo',
      directory: 'docs/product/requirements',
      runGit: () => '',
      window: WINDOW,
    });

    expect(result).toMatchObject({ available: true, commits: 0, files: {} });
  });

  it('bounds the log above as well as below', () => {
    const asked = [];
    readRegisterActivity({
      cwd: '/repo',
      directory: 'docs/coordination/tasks',
      runGit: ({ args }) => {
        asked.push(args);
        return '';
      },
      window: WINDOW,
    });

    expect(asked[0]).toContain('--since=2026-06-04T00:00:00Z');
    expect(asked[0]).toContain('--until=2026-09-01T23:59:59Z');
  });

  it('reports no activity from after the window, whatever the log holds', () => {
    const result = readRegisterActivity({
      cwd: '/repo',
      directory: 'docs/coordination/tasks',
      runGit: () => LOG,
      window: WINDOW,
    });

    expect(result.commits).toBe(1);
    expect(result.lastActivity).toBe('2026-08-30');
    expect(result.files['docs/coordination/tasks/two.md']).toBeUndefined();
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
