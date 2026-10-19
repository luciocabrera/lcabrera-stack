import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vite-plus/test';

import { resolveTool } from './host-tool.mjs';
import { scratchRoots } from './worktree-fixtures.mjs';
import {
  parseContainers,
  pullRequestReader,
  summarisePullRequests,
  systemHosts,
  THROWAWAY_LABEL,
} from './worktree-hosts.mjs';
import { PR_STATES } from './worktree-plan.mjs';

const { drain, make } = scratchRoots();

afterEach(drain);

const plantTool = ({ body, directory, name }) => {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, name);
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
  return path;
};

describe('summarisePullRequests', () => {
  test('prefers an open pull request, then a merged one', () => {
    expect(
      summarisePullRequests([
        { number: 1, state: 'CLOSED' },
        { headRefOid: 'abc', number: 2, state: 'MERGED' },
      ]),
    ).toEqual({ headRefOid: 'abc', number: 2, state: PR_STATES.merged });
    expect(
      summarisePullRequests([
        { number: 2, state: 'MERGED' },
        { number: 3, state: 'open' },
      ]).state,
    ).toBe(PR_STATES.open);
  });

  test('answers none for an empty list', () => {
    expect(summarisePullRequests([])).toEqual({ state: PR_STATES.none });
  });
});

describe('parseContainers', () => {
  test('reads each line and the worktree its label names', () => {
    const output = [
      JSON.stringify({
        ID: 'a1',
        Labels: `x=y,${THROWAWAY_LABEL}=/work/one`,
        Names: 'pg-one',
        State: 'running',
      }),
      JSON.stringify({
        ID: 'b2',
        Labels: `${THROWAWAY_LABEL}=`,
        Names: 'pg-two',
        State: 'exited',
      }),
      'not json',
    ].join('\n');
    expect(parseContainers(output)).toEqual([
      { id: 'a1', name: 'pg-one', running: true, worktree: '/work/one' },
      { id: 'b2', name: 'pg-two', running: false, worktree: '' },
    ]);
  });
});

describe('pullRequestReader', () => {
  test('reports gh as missing without spawning anything', () => {
    const read = pullRequestReader({ cwd: make(), gh: undefined });
    expect(read({ branch: 'feature', head: 'abc' })).toEqual({
      reason: 'gh is not installed',
      state: PR_STATES.unknown,
    });
  });

  test('answers every later lookup with the first failure, after one call', () => {
    const root = make();
    const marker = join(root, 'calls');
    const gh = plantTool({
      body: `echo call >> '${marker}'\necho 'not logged in' >&2\nexit 4`,
      directory: join(root, 'bin'),
      name: 'gh',
    });
    const read = pullRequestReader({ cwd: root, gh });

    const first = read({ branch: 'one', head: 'a' });
    const second = read({ branch: 'two', head: 'b' });

    expect(first).toMatchObject({
      reason: expect.stringContaining('not logged in'),
      state: PR_STATES.unknown,
    });
    expect(second).toEqual(first);
  });

  test('matches a detached commit only to a pull request whose head it is', () => {
    const root = make();
    const gh = plantTool({
      body: `echo '[{"number":5,"state":"MERGED","headRefOid":"other"},{"number":6,"state":"MERGED","headRefOid":"abc"}]'`,
      directory: join(root, 'bin'),
      name: 'gh',
    });
    expect(pullRequestReader({ cwd: root, gh })({ head: 'abc' })).toMatchObject(
      { number: 6 },
    );
    expect(pullRequestReader({ cwd: root, gh })({ head: 'zzz' })).toEqual({
      state: PR_STATES.none,
    });
  });
});

describe('systemHosts with neither tool installed', () => {
  test('answers for both without throwing', () => {
    const root = make();
    const hosts = systemHosts({
      directories: [join(root, 'none')],
      pathEntries: [],
    });

    expect(hosts.containers(root)).toEqual({
      containers: [],
      error: 'docker is not installed',
    });
    expect(hosts.pullRequests(root)({ branch: 'x', head: 'y' }).reason).toBe(
      'gh is not installed',
    );
    expect(hosts.removeContainer({ cwd: root, id: '1' })).toEqual({
      ok: false,
      reason: 'docker is not installed',
    });
  });

  test('resolves a tool from PATH when no fixed location holds it', () => {
    const root = make();
    const planted = plantTool({
      body: 'exit 0',
      directory: join(root, 'path-bin'),
      name: 'docker',
    });
    expect(
      resolveTool({
        directories: [join(root, 'none')],
        name: 'docker',
        pathEntries: [join(root, 'path-bin')],
      }),
    ).toBe(planted);
  });
});
