/**
 * What the merge-queue lane's `--require-analysis` rests on: a wait that ends
 * because SonarCloud has analysed THIS head commit, and does not end for any
 * other reason.
 *
 * The case that matters is a pull request whose head was pushed long enough ago
 * that `api/ce/activity`'s recency window no longer holds its analysis. Nothing
 * re-analyses inside a merge queue, so that wait can only time out — and under
 * `--require-analysis` a timeout ejects the entry while a valid analysis of
 * exactly that commit sits in SonarCloud. The activity-only cases are kept
 * alongside so a green run cannot come from the sha probe answering everything.
 */
import { describe, expect, it } from 'vite-plus/test';

import { analysedHead, analysisState, waitForAnalysis } from './sonar-wait.mjs';

const PR = { type: 'pullRequest', value: '1038' };
const HEAD = '29e59aec12ac93358abce2373b88475d9d0f2f35';
const PUSHED_AT = '2026-08-24T10:00:00+0000';

const task = (overrides) => ({
  pullRequest: '1042',
  status: 'SUCCESS',
  submittedAt: '2026-08-30T17:53:00+0000',
  ...overrides,
});

const stubApi = ({ pullRequests = [], tasks = [] }) => {
  const calls = [];
  const fetchJson = (url) => {
    calls.push(url);
    return Promise.resolve(
      url.includes('/api/project_pull_requests/list')
        ? { pullRequests }
        : { tasks },
    );
  };
  return { calls, fetchJson };
};

const wait = ({ headSha, pullRequests, tasks }) => {
  const { calls, fetchJson } = stubApi({ pullRequests, tasks });
  return {
    calls,
    result: waitForAnalysis({
      base: 'https://sonarcloud.io',
      fetchJson,
      headSha,
      intervalMs: 0,
      project: 'luciocabrera_vite-react-compiler',
      since: PUSHED_AT,
      target: PR,
      timeoutMs: 30,
      token: 'stub',
    }),
  };
};

describe('analysedHead', () => {
  it('matches the commit SonarCloud analysed for this pull request', () => {
    const entries = [
      { commit: { sha: 'aaaa' }, key: '1042' },
      { commit: { sha: HEAD }, key: '1038' },
    ];
    expect(analysedHead(entries, PR, HEAD)).toBe(true);
  });

  it('is case-insensitive about the sha, and nothing else', () => {
    const entries = [{ commit: { sha: HEAD.toUpperCase() }, key: '1038' }];
    expect(analysedHead(entries, PR, HEAD)).toBe(true);
    expect(analysedHead(entries, PR, `${HEAD.slice(0, 39)}0`)).toBe(false);
  });

  it('refuses a different entry, a missing one, and a branch target', () => {
    const entries = [{ commit: { sha: HEAD }, key: '1042' }];
    expect(analysedHead(entries, PR, HEAD)).toBe(false);
    expect(analysedHead([], PR, HEAD)).toBe(false);
    expect(analysedHead(entries, { type: 'branch', value: 'main' }, HEAD)).toBe(
      false,
    );
  });

  it('refuses an entry whose analysed sha is absent rather than throwing', () => {
    expect(
      analysedHead([{ commit: { sha: null }, key: '1038' }], PR, HEAD),
    ).toBe(false);
    expect(analysedHead([{ commit: {}, key: '1038' }], PR, HEAD)).toBe(false);
    expect(analysedHead([{ key: '1038' }], PR, HEAD)).toBe(false);
  });

  it('refuses every entry when no head sha was supplied', () => {
    const entries = [{ commit: { sha: HEAD }, key: '1038' }];
    expect(analysedHead(entries, PR, undefined)).toBe(false);
  });
});

describe('a head whose analysis has fallen out of the activity window', () => {
  const outOfWindow = Array.from({ length: 25 }, (_, index) =>
    task({ submittedAt: `2026-08-3${index % 2}T1${index % 10}:00:00+0000` }),
  );

  it('is pending to the Compute Engine probe, which is the defect', () => {
    expect(analysisState(outOfWindow, PR, PUSHED_AT)).toBe('pending');
  });

  it('is ready once the analysed commit is compared instead', async () => {
    const { calls, result } = wait({
      headSha: HEAD,
      pullRequests: [{ commit: { sha: HEAD }, key: '1038' }],
      tasks: outOfWindow,
    });
    expect(await result).toBe(true);
    expect(calls[0]).toContain('/api/project_pull_requests/list');
  });

  it('still times out when SonarCloud analysed some other commit', async () => {
    const { result } = wait({
      headSha: HEAD,
      pullRequests: [{ commit: { sha: 'f00dcafe' }, key: '1038' }],
      tasks: outOfWindow,
    });
    expect(await result).toBe(false);
  });

  it('still times out when no head sha is passed', async () => {
    const { result } = wait({
      headSha: undefined,
      pullRequests: [{ commit: { sha: HEAD }, key: '1038' }],
      tasks: outOfWindow,
    });
    expect(await result).toBe(false);
  });
});

describe('the Compute Engine probe, unchanged', () => {
  it('reports ready on a fresh success for this target', () => {
    const tasks = [task({ pullRequest: '1038' })];
    expect(analysisState(tasks, PR, PUSHED_AT)).toBe('ready');
  });

  it('reports pending while this target is still analysing', () => {
    const tasks = [task({ pullRequest: '1038', status: 'IN_PROGRESS' })];
    expect(analysisState(tasks, PR, PUSHED_AT)).toBe('pending');
  });

  it('reports failed on a fresh failure, and the wait throws', async () => {
    const tasks = [task({ pullRequest: '1038', status: 'FAILED' })];
    expect(analysisState(tasks, PR, PUSHED_AT)).toBe('failed');
    const { result } = wait({
      headSha: HEAD,
      pullRequests: [{ commit: { sha: 'f00dcafe' }, key: '1038' }],
      tasks,
    });
    await expect(result).rejects.toThrow('SonarCloud analysis failed');
  });

  it('asks for the in-flight statuses, which the endpoint omits by default', async () => {
    const { calls, result } = wait({
      headSha: undefined,
      pullRequests: [],
      tasks: [],
    });
    await result;
    expect(calls.find((url) => url.includes('/api/ce/activity'))).toContain(
      'status=SUCCESS,FAILED,CANCELED,PENDING,IN_PROGRESS',
    );
  });

  it('rejects a success submitted before the head commit', () => {
    const tasks = [
      task({ pullRequest: '1038', submittedAt: '2026-08-01T00:00:00+0000' }),
    ];
    expect(analysisState(tasks, PR, PUSHED_AT)).toBe('pending');
  });
});
