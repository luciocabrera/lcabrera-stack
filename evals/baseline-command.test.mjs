import { describe, expect, it, vi } from 'vite-plus/test';

import {
  BASELINE_RUNNERS,
  dirtyTreeProblem,
  interruptCode,
  parseBaselineArgs,
  runBaseline,
  runEnvironment,
  runnerArgs,
} from './baseline-command.mjs';

const BASELINE = '11111111-1111-4111-8111-111111111111';

const effectsFor = (overrides = {}) => ({
  error: vi.fn(),
  gitStatus: vi.fn(() => ''),
  log: vi.fn(),
  mintId: vi.fn(() => BASELINE),
  probeDatabase: vi.fn(() => Promise.resolve({ ok: true })),
  record: vi.fn(() => Promise.resolve(0)),
  runOnce: vi.fn(() => ({ signal: null, status: 1 })),
  ...overrides,
});

describe('parseBaselineArgs', () => {
  it('takes the suite, the runs and an optional model', () => {
    expect(
      parseBaselineArgs({
        argv: ['--suite', 'skills', '--runs', '3', '--model', 'claude-x'],
        defaultRuns: 5,
      }),
    ).toEqual({ model: 'claude-x', ok: true, runs: 3, suite: 'skills' });
    expect(
      parseBaselineArgs({
        argv: ['--suite', 'verifier-tooled'],
        defaultRuns: 5,
      }),
    ).toEqual({
      model: undefined,
      ok: true,
      runs: 5,
      suite: 'verifier-tooled',
    });
  });

  it.each([
    [[], '--suite is required'],
    [['--suite', 'rules-consistency'], '--suite must be one of'],
    [
      ['--suite', 'skills', '--runs', '1'],
      '--runs must be a whole number of at least 2; got "1"',
    ],
    [['--suite', 'skills', '--runs', '2.5'], 'at least 2; got "2.5"'],
    [['--suite', 'verifier-fixtures', '--model', 'x'], 'fixes its own model'],
    [['--suite', 'skills', 'extra'], 'evals:baseline:'],
  ])('refuses %j', (argv, message) => {
    const parsed = parseBaselineArgs({ argv, defaultRuns: 5 });

    expect(parsed.ok).toBe(false);
    expect(parsed.message).toContain(message);
    expect(parsed.message).toMatch(/^evals:baseline: /u);
  });
});

describe('dirtyTreeProblem', () => {
  it('passes a clean tree and names every change in a dirty one', () => {
    expect(dirtyTreeProblem('')).toBeNull();
    expect(dirtyTreeProblem('M evals/README.md\n ?? scratch.txt\n')).toBe(
      [
        'evals:baseline: the working tree is dirty, so a baseline would not describe any commit. Commit or discard these first:',
        '  M evals/README.md',
        '  ?? scratch.txt',
      ].join('\n'),
    );
  });

  it('refuses when git cannot say', () => {
    expect(dirtyTreeProblem(undefined)).toMatch(/could not read git status/u);
  });
});

describe('interruptCode', () => {
  it('treats a signal or an interrupted runner as the end, and a failing run as data', () => {
    expect(interruptCode({ signal: 'SIGINT', status: null })).toBe(130);
    expect(interruptCode({ signal: 'SIGTERM', status: null })).toBe(143);
    expect(interruptCode({ signal: 'SIGKILL', status: null })).toBe(1);
    expect(interruptCode({ signal: null, status: 130 })).toBe(130);
    expect(interruptCode({ signal: null, status: 1 })).toBeNull();
    expect(interruptCode({ signal: null, status: 0 })).toBeNull();
  });
});

describe('runner wiring', () => {
  it('names a runner that exists for every suite', async () => {
    const { existsSync } = await import('node:fs');

    for (const runner of Object.values(BASELINE_RUNNERS)) {
      expect(existsSync(new URL(runner, import.meta.url))).toBe(true);
    }
  });

  it('forwards only the model, and tags the child with the baseline id', () => {
    expect(runnerArgs({ model: undefined })).toEqual([]);
    expect(runnerArgs({ model: 'm' })).toEqual(['--model', 'm']);
    expect(runEnvironment({ baselineId: BASELINE, env: { A: '1' } })).toEqual({
      A: '1',
      EVALS_BASELINE_ID: BASELINE,
    });
  });
});

describe('runBaseline', () => {
  it('refuses a dirty tree, says so, and runs nothing', async () => {
    const effects = effectsFor({ gitStatus: vi.fn(() => 'M package.json') });

    expect(
      await runBaseline({
        argv: ['--suite', 'skills'],
        defaultRuns: 5,
        effects,
      }),
    ).toBe(1);
    expect(effects.error).toHaveBeenCalledWith(
      expect.stringContaining('the working tree is dirty'),
    );
    expect(effects.probeDatabase).not.toHaveBeenCalled();
    expect(effects.runOnce).not.toHaveBeenCalled();
    expect(effects.record).not.toHaveBeenCalled();
  });

  it('refuses before any run when the database cannot take the result', async () => {
    const effects = effectsFor({
      probeDatabase: vi.fn(() =>
        Promise.resolve({ message: 'evals:baseline: cannot reach', ok: false }),
      ),
    });

    expect(
      await runBaseline({
        argv: ['--suite', 'skills'],
        defaultRuns: 5,
        effects,
      }),
    ).toBe(1);
    expect(effects.error).toHaveBeenCalledWith('evals:baseline: cannot reach');
    expect(effects.runOnce).not.toHaveBeenCalled();
  });

  it('runs the suite N times under one baseline id, then records it', async () => {
    const effects = effectsFor({ record: vi.fn(() => Promise.resolve(0)) });

    expect(
      await runBaseline({
        argv: ['--suite', 'skills', '--model', 'm'],
        defaultRuns: 3,
        effects,
      }),
    ).toBe(0);
    expect(effects.runOnce).toHaveBeenCalledTimes(3);
    expect(effects.runOnce).toHaveBeenCalledWith({
      baselineId: BASELINE,
      model: 'm',
      suite: 'skills',
    });
    expect(effects.mintId).toHaveBeenCalledOnce();
    expect(effects.record).toHaveBeenCalledWith({
      baselineId: BASELINE,
      suite: 'skills',
    });
  });

  it('stops at an interrupt and records nothing', async () => {
    const effects = effectsFor({
      runOnce: vi.fn(() => ({ signal: 'SIGINT', status: null })),
    });

    expect(
      await runBaseline({
        argv: ['--suite', 'skills'],
        defaultRuns: 5,
        effects,
      }),
    ).toBe(130);
    expect(effects.runOnce).toHaveBeenCalledOnce();
    expect(effects.record).not.toHaveBeenCalled();
  });

  it('refuses bad arguments before touching git', async () => {
    const effects = effectsFor();

    expect(await runBaseline({ argv: [], defaultRuns: 5, effects })).toBe(1);
    expect(effects.gitStatus).not.toHaveBeenCalled();
  });
});
