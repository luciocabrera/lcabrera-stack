import { spawn } from 'node:child_process';
import { describe, expect, it } from 'vite-plus/test';

import { exitStatusOf } from './changed-runner.mjs';

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
