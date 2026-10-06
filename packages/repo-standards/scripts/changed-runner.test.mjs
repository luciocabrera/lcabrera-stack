import { spawn } from 'node:child_process';
import { describe, expect, it } from 'vite-plus/test';

import { exitStatusOf, runInSequence } from './changed-runner.mjs';

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
