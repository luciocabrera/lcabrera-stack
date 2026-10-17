import { describe, expect, it, vi } from 'vite-plus/test';

import { runSummaryCommand } from './summary-command.mjs';

const fakeLog = () => ({ error: vi.fn(), log: vi.fn() });

describe('runSummaryCommand', () => {
  it('prints the summary and exits with its code', async () => {
    const log = fakeLog();
    const target = { exitCode: undefined };

    await runSummaryCommand({
      log,
      name: 'evals:x',
      process: target,
      summarize: () =>
        Promise.resolve({ exitCode: 1, stderr: ['warned'], stdout: ['out'] }),
    });

    expect(log.log).toHaveBeenCalledWith('out');
    expect(log.error).toHaveBeenCalledWith('warned');
    expect(target.exitCode).toBe(1);
  });

  it('names the command and exits 1 when the summary throws', async () => {
    const log = fakeLog();
    const target = { exitCode: undefined };

    await runSummaryCommand({
      log,
      name: 'evals:x',
      process: target,
      summarize: () => Promise.reject(new Error('boom')),
    });

    expect(log.error).toHaveBeenCalledWith('evals:x: boom');
    expect(target.exitCode).toBe(1);
  });
});
