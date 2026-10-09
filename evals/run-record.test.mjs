import { EventEmitter } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import {
  rulesPlan as plan,
  rulesTrial as trial,
  STARTED_AT,
  testIdentity,
} from './envelope-test-support.mjs';
import {
  recordRun,
  runIdentity,
  runnerHarnessVersion,
  saveEnvelope,
  saveTranscript,
} from './run-record.mjs';

let resultsDir;
let ingest;

const written = () =>
  JSON.parse(
    readFileSync(
      join(resultsDir, 'rules-consistency', `${testIdentity.run_id}.json`),
      'utf8',
    ),
  );

const record = (overrides) =>
  recordRun({
    clock: () => STARTED_AT + 2000,
    identity: testIdentity,
    ingest,
    plan,
    resultsDir,
    signals: new EventEmitter(),
    ...overrides,
  });

beforeEach(() => {
  resultsDir = mkdtempSync(join(tmpdir(), 'eval-results-'));
  ingest = vi.fn(async () => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(resultsDir, { force: true, recursive: true });
});

describe('recordRun', () => {
  it('writes a complete envelope on a normal finish and returns it', async () => {
    const outcome = await record({
      execute: ({ addTrial }) => {
        addTrial(trial);
        return 'done';
      },
    });
    expect(outcome.result).toBe('done');
    expect(outcome.envelope.run.status).toBe('complete');
    expect(written()).toMatchObject({
      run: { status: 'complete', totals: { trials: 1 } },
      schema_version: 1,
    });
  });

  it('writes the trials finished so far as partial when the run throws', async () => {
    await expect(
      record({
        execute: async ({ addTrial }) => {
          addTrial(trial);
          throw new Error('usage limit reached');
        },
      }),
    ).rejects.toThrow('usage limit reached');
    expect(written()).toMatchObject({
      run: { status: 'partial', totals: { trials: 1 } },
    });
  });

  it('writes an aborted envelope on SIGINT or SIGTERM, then raises the signal again', async () => {
    for (const signal of ['SIGINT', 'SIGTERM']) {
      const signals = new EventEmitter();
      const raise = vi.fn();
      const started = Promise.withResolvers();
      void record({
        execute: ({ addTrial }) => {
          addTrial(trial);
          started.resolve();
          return Promise.withResolvers().promise;
        },
        raise,
        signals,
      });
      await started.promise;
      signals.emit(signal);
      expect(raise).toHaveBeenCalledWith(signal);
      expect(signals.listenerCount('SIGINT')).toBe(0);
      expect(signals.listenerCount('SIGTERM')).toBe(0);
      expect(written()).toMatchObject({
        run: { status: 'aborted', totals: { trials: 1 } },
      });
    }
  });

  it('sends a complete or partial envelope once it is written', async () => {
    const file = join(
      resultsDir,
      'rules-consistency',
      `${testIdentity.run_id}.json`,
    );
    await record({ execute: () => undefined });
    expect(ingest).toHaveBeenLastCalledWith({ file });
    await expect(
      record({
        execute: () => {
          throw new Error('usage limit reached');
        },
      }),
    ).rejects.toThrow('usage limit reached');
    expect(ingest).toHaveBeenCalledTimes(2);
    expect(ingest).toHaveBeenLastCalledWith({ file });
  });

  it('sends the envelope only once its pass rate is written', async () => {
    const sent = [];
    ingest = vi.fn(async ({ file }) => {
      sent.push(JSON.parse(readFileSync(file, 'utf8')).run.totals.pass_rate);
    });
    await record({
      execute: ({ addTrial }) => {
        for (const trialIndex of [0, 1, 2, 3, 4, 5]) {
          addTrial({ ...trial, trial_index: trialIndex });
        }
      },
    });
    expect(sent).toStrictEqual([
      {
        k: 6,
        lower: expect.closeTo(0.6097, 4),
        n: 6,
        rate: 1,
        upper: expect.closeTo(1, 4),
      },
    ]);
  });

  it('does not rewrite the saved envelope when a signal arrives during ingest', async () => {
    for (const fails of [false, true]) {
      const signals = new EventEmitter();
      const raise = vi.fn();
      const statuses = [];
      ingest = vi.fn(async () => {
        signals.emit('SIGINT');
        signals.emit('SIGTERM');
        statuses.push(written().run.status);
      });
      const run = record({
        execute: ({ addTrial }) => {
          addTrial(trial);
          if (fails) {
            throw new Error('usage limit reached');
          }
        },
        raise,
        signals,
      });
      await (fails ? expect(run).rejects.toThrow('usage limit reached') : run);
      const status = fails ? 'partial' : 'complete';
      expect(statuses).toStrictEqual([status]);
      expect(written().run.status).toBe(status);
      expect(raise).not.toHaveBeenCalled();
    }
  });

  it('leaves an aborted envelope on disk for evals:ingest', async () => {
    const signals = new EventEmitter();
    const started = Promise.withResolvers();
    void record({
      execute: () => {
        started.resolve();
        return Promise.withResolvers().promise;
      },
      raise: vi.fn(),
      signals,
    });
    await started.promise;
    signals.emit('SIGINT');
    expect(written().run.status).toBe('aborted');
    expect(ingest).not.toHaveBeenCalled();
  });

  it('prints the pass rate the envelope carries, at the thresholds in regression.config.json', async () => {
    const outcome = await record({
      execute: ({ addTrial }) => {
        for (const trialIndex of [0, 1, 2, 3, 4, 5]) {
          addTrial({ ...trial, trial_index: trialIndex });
        }
      },
    });
    expect(written().run.totals.pass_rate).toStrictEqual({
      k: 6,
      lower: expect.closeTo(0.6097, 4),
      n: 6,
      rate: 1,
      upper: expect.closeTo(1, 4),
    });
    expect(outcome.envelope.run.totals.pass_rate).toStrictEqual(
      written().run.totals.pass_rate,
    );
    expect(console.log).toHaveBeenCalledWith(
      'Pass rate: 100.0% (n=6, 6 passed; Wilson interval 61.0%–100.0% at z=1.96)',
    );
  });

  it('prints and records insufficient data below the minimum trials', async () => {
    await record({ execute: ({ addTrial }) => addTrial(trial) });
    expect(written().run.totals.pass_rate).toStrictEqual({
      k: 1,
      lower: null,
      n: 1,
      rate: null,
      upper: null,
    });
    expect(console.log).toHaveBeenCalledWith(
      'Pass rate: insufficient data (n=1, 1 passed; a rate needs 6 counted trials)',
    );
  });

  it('applies the thresholds it is given', async () => {
    await record({
      execute: ({ addTrial }) => addTrial(trial),
      regressionConfig: Promise.resolve({ minTrialsForRate: 1, z: 1.96 }),
    });
    expect(written().run.totals.pass_rate.rate).toBe(1);
  });

  it('stops listening for signals once the run is recorded', async () => {
    const signals = new EventEmitter();
    await record({ execute: () => undefined, signals });
    expect(signals.listenerCount('SIGINT')).toBe(0);
    expect(signals.listenerCount('SIGTERM')).toBe(0);
  });

  it('refuses an envelope that fails validation and names the field', async () => {
    await expect(
      record({
        execute: () => undefined,
        identity: { ...testIdentity, git_sha: 'not-a-sha' },
      }),
    ).rejects.toThrow(/run\.git_sha/u);
    expect(() => written()).toThrow();
  });
});

describe('saveEnvelope', () => {
  it('names every failing field in its error', () => {
    expect(() =>
      saveEnvelope({
        envelope: { run: { suite: 'skills' }, schema_version: 2 },
        resultsDir,
      }),
    ).toThrow(
      /the skills run envelope failed validation:[\s\S]*schema_version/u,
    );
  });
});

describe('saveTranscript', () => {
  it('writes beside the envelope and returns its size and hash', () => {
    const transcript = saveTranscript({
      name: 'react-19-trigger-1.json',
      resultsDir,
      runId: testIdentity.run_id,
      suite: 'skills',
      text: 'abc',
    });
    expect(transcript).toStrictEqual({
      bytes: 3,
      sha256:
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      uri: join(
        resultsDir,
        'skills',
        testIdentity.run_id,
        'react-19-trigger-1.json',
      ),
    });
    expect(readFileSync(transcript.uri, 'utf8')).toBe('abc');
  });
});

describe('runnerHarnessVersion', () => {
  it('hashes the runner and the evals modules it imports to 12 hex characters', () => {
    const version = runnerHarnessVersion(
      new URL(
        'rules-consistency/verify-rules-consistency.mjs',
        import.meta.url,
      ),
    );
    expect(version).toMatch(/^[0-9a-f]{12}$/u);
    expect(
      runnerHarnessVersion(
        new URL('skills/verify-skill-triggers.mjs', import.meta.url),
      ),
    ).not.toBe(version);
  });
});

describe('runIdentity', () => {
  it('reads the commit and mints a fresh uuid each run', () => {
    const identity = runIdentity({ env: {}, now: STARTED_AT });
    expect(identity.git_sha).toMatch(/^[0-9a-f]{40}$/u);
    expect(identity.trigger).toBe('local');
    expect(identity.started_at).toBe('2026-10-06T09:00:00.000Z');
    expect(runIdentity({ env: {} }).run_id).not.toBe(identity.run_id);
  });
});
