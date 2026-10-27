import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import {
  exitStatusOf,
  filteredRunArgs,
  REPO_ROOT,
  runInSequence,
} from './changed-runner.mjs';
import { createFixtureRoots, writeIn } from './repo-fixtures.mjs';

const recordingRunner = (events) => (group) => {
  events.push(`start ${group.name}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      events.push(`close ${group.name}`);
      resolve(group.code);
    }, group.delay);
  });
};

describe('runInSequence', () => {
  it('starts each group only after the one before it has closed', async () => {
    const events = [];
    await runInSequence(
      [
        { code: 0, delay: 20, name: 'a' },
        { code: 0, delay: 0, name: 'b' },
      ],
      recordingRunner(events),
    );

    expect(events).toStrictEqual(['start a', 'close a', 'start b', 'close b']);
  });

  it('returns the code of the last group that failed', async () => {
    const groups = [
      { code: 2, delay: 0, name: 'a' },
      { code: 5, delay: 0, name: 'b' },
      { code: 0, delay: 0, name: 'c' },
    ];

    await expect(runInSequence(groups, recordingRunner([]))).resolves.toBe(5);
  });

  it('returns 0 when every group passes, and for no groups at all', async () => {
    await expect(
      runInSequence([{ code: 0, delay: 0, name: 'a' }], recordingRunner([])),
    ).resolves.toBe(0);
    await expect(runInSequence([], recordingRunner([]))).resolves.toBe(0);
  });
});

const runNode = (source) =>
  exitStatusOf(spawn(process.execPath, ['-e', source], { stdio: 'ignore' }));

describe('exitStatusOf', () => {
  it('reports a clean exit as 0', async () => {
    await expect(runNode('process.exit(0)')).resolves.toBe(0);
  });

  it('reports the exit code a failing child returns', async () => {
    await expect(runNode('process.exit(3)')).resolves.toBe(3);
  });

  it('reports a child killed by a signal as a failure', async () => {
    await expect(runNode("process.kill(process.pid, 'SIGKILL')")).resolves.toBe(
      1,
    );
  });

  it('reports a child that cannot be spawned as a failure', async () => {
    await expect(
      exitStatusOf(spawn('/nonexistent/binary', [], { stdio: 'ignore' })),
    ).resolves.toBe(1);
  });
});

const roots = createFixtureRoots('changed-runner-');

afterAll(() => {
  roots.removeAll();
});

const probeWorkspace = () => {
  const root = roots.make();
  const write = writeIn(root);
  write('pnpm-workspace.yaml', 'packages:\n  - packages/*\n');
  write('package.json', '{"name":"probe-root","private":true}\n');
  write(
    'packages/a/package.json',
    '{"name":"@repo-standards-probe/a","private":true,"scripts":{"test":"node -e 0"}}\n',
  );
  return root;
};

const runVp = (cwd, args) =>
  exitStatusOf(
    spawn(join(REPO_ROOT, 'node_modules', '.bin', 'vp'), args, {
      cwd,
      stdio: 'ignore',
    }),
  );

describe('filteredRunArgs', () => {
  it('makes a filtered run fail when a filter matches no workspace', () => {
    expect(filteredRunArgs({ packages: ['a', 'b'], task: 'test' })).toEqual([
      'run',
      '--fail-if-no-match',
      '--filter',
      'a',
      '--filter',
      'b',
      'test',
    ]);
  });

  it('runs a root task with no filter as it is', () => {
    expect(filteredRunArgs({ packages: [], task: 'test:scripts' })).toEqual([
      'run',
      'test:scripts',
    ]);
  });

  it('is refused by the runner when a filter matches nothing, where the bare filter passes', async () => {
    const args = filteredRunArgs({
      packages: ['@repo-standards-probe/no-such-workspace'],
      task: 'test',
    });
    const bare = args.filter((arg) => arg !== '--fail-if-no-match');
    const workspace = probeWorkspace();

    await expect(runVp(workspace, bare)).resolves.toBe(0);
    await expect(runVp(workspace, args)).resolves.not.toBe(0);
  });
});
