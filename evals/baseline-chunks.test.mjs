import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vite-plus/test';

import {
  BASELINE,
  effectsFor,
  HEAD,
  OTHER_SHA,
  PRIOR_FILE,
  priorRuns,
} from './baseline-command-test-support.mjs';
import {
  BASELINE_RUNNERS,
  continuation,
  parseBaselineArgs,
  runBaseline,
} from './baseline-command.mjs';

describe('parseBaselineArgs for a baseline built in chunks', () => {
  it('takes one run, so a baseline can be built a run at a time', () => {
    expect(
      parseBaselineArgs({
        argv: ['--suite', 'skills', '--runs', '1', '--baseline-id', BASELINE],
        defaultRuns: 5,
      }),
    ).toEqual({
      baselineId: BASELINE,
      model: undefined,
      ok: true,
      runs: 1,
      suite: 'skills',
    });
  });
});

const decide = (overrides = {}) =>
  continuation({
    baselineId: BASELINE,
    gitSha: HEAD,
    model: undefined,
    prior: priorRuns(),
    suite: 'skills',
    ...overrides,
  });

describe('continuation', () => {
  it('continues on the commit and model the baseline was started on', () => {
    expect(decide()).toEqual({
      model: 'claude-opus-5-5',
      ok: true,
      priorFiles: [PRIOR_FILE],
    });
    expect(decide({ model: 'claude-opus-5-5' }).ok).toBe(true);
  });

  it('refuses another commit, naming both', () => {
    expect(decide({ gitSha: OTHER_SHA })).toEqual({
      message: `evals:baseline: baseline ${BASELINE} was started on commit ${HEAD}, and this run is on commit ${OTHER_SHA}; a baseline spans one commit, so start a new one`,
      ok: false,
    });
  });

  it('refuses another model, naming both', () => {
    expect(decide({ model: 'claude-other' })).toEqual({
      message: `evals:baseline: baseline ${BASELINE} was started on model claude-opus-5-5, and this run is on model claude-other; a baseline spans one model, so start a new one`,
      ok: false,
    });
  });

  it('passes no model to a runner that fixes its own, and still checks the commit', () => {
    expect(
      decide({
        prior: priorRuns({ modelIds: ['claude-fixed'] }),
        suite: 'verifier-fixtures',
      }),
    ).toEqual({ model: undefined, ok: true, priorFiles: [PRIOR_FILE] });
    expect(
      decide({ gitSha: OTHER_SHA, suite: 'verifier-fixtures' }).message,
    ).toContain(`commit ${HEAD}, and this run is on commit ${OTHER_SHA}`);
  });

  it('refuses a baseline with no readable run, or a HEAD it cannot read', () => {
    expect(
      decide({ prior: priorRuns({ files: [], gitShas: [], modelIds: [] }) })
        .message,
    ).toBe(
      `evals:baseline: no readable run of baseline ${BASELINE} is under the skills results, so there is nothing to continue; leave out --baseline-id to start one`,
    );
    expect(decide({ gitSha: undefined }).message).toMatch(
      /could not read the commit at HEAD/u,
    );
  });
});

describe('runBaseline --baseline-id', () => {
  it('adds the runs to the baseline, and records over every run it holds', async () => {
    const effects = effectsFor();

    expect(
      await runBaseline({
        argv: ['--suite', 'skills', '--runs', '2', '--baseline-id', BASELINE],
        defaultRuns: 5,
        effects,
      }),
    ).toBe(0);
    expect(effects.mintId).not.toHaveBeenCalled();
    expect(effects.baselineSoFar).toHaveBeenCalledWith({
      baselineId: BASELINE,
      suite: 'skills',
    });
    expect(effects.runOnce).toHaveBeenCalledTimes(2);
    expect(effects.runOnce).toHaveBeenCalledWith({
      baselineId: BASELINE,
      model: 'claude-opus-5-5',
      suite: 'skills',
    });
    expect(effects.checkRuns).toHaveBeenCalledWith({
      baselineId: BASELINE,
      exclude: [PRIOR_FILE],
      model: 'claude-opus-5-5',
      runs: 1,
      suite: 'skills',
    });
    expect(effects.record).toHaveBeenCalledWith({
      baselineId: BASELINE,
      runs: 3,
      suite: 'skills',
    });
  });

  it('refuses another commit before any run, naming both', async () => {
    const effects = effectsFor({ gitHead: vi.fn(() => OTHER_SHA) });

    expect(
      await runBaseline({
        argv: ['--suite', 'skills', '--baseline-id', BASELINE],
        defaultRuns: 1,
        effects,
      }),
    ).toBe(1);
    expect(effects.error).toHaveBeenCalledWith(
      expect.stringContaining(
        `started on commit ${HEAD}, and this run is on commit ${OTHER_SHA}`,
      ),
    );
    expect(effects.runOnce).not.toHaveBeenCalled();
    expect(effects.probeDatabase).not.toHaveBeenCalled();
  });

  it('refuses another model before any run, naming both', async () => {
    const effects = effectsFor();

    expect(
      await runBaseline({
        argv: [
          '--suite',
          'skills',
          '--baseline-id',
          BASELINE,
          '--model',
          'claude-other',
        ],
        defaultRuns: 1,
        effects,
      }),
    ).toBe(1);
    expect(effects.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'started on model claude-opus-5-5, and this run is on model claude-other',
      ),
    );
    expect(effects.runOnce).not.toHaveBeenCalled();
  });
});

const limitedAt = (limited) => {
  let calls = 0;
  return vi.fn(() => {
    calls += 1;
    return { signal: null, status: calls === limited ? 75 : 0 };
  });
};

describe('runBaseline at the session limit', () => {
  it('stops at the run the limit cut off, records the rest without it, and exits non-zero', async () => {
    const effects = effectsFor({ runOnce: limitedAt(2) });

    expect(
      await runBaseline({
        argv: ['--suite', 'skills', '--runs', '4'],
        defaultRuns: 5,
        effects,
      }),
    ).toBe(75);
    expect(effects.runOnce).toHaveBeenCalledTimes(2);
    expect(effects.checkRuns).toHaveBeenCalledOnce();
    expect(effects.error).toHaveBeenCalledWith(
      `evals:baseline: run 2 of 4 was cut off by the session limit, so it is left out and no run after it was started; once the limit resets, continue with --baseline-id ${BASELINE}`,
    );
    expect(effects.record).toHaveBeenCalledWith({
      baselineId: BASELINE,
      runs: 2,
      suite: 'skills',
    });
  });

  it('exits non-zero even when the cut-off run is the last one', async () => {
    const effects = effectsFor({ runOnce: limitedAt(1) });

    expect(
      await runBaseline({
        argv: ['--suite', 'skills', '--runs', '1', '--baseline-id', BASELINE],
        defaultRuns: 5,
        effects,
      }),
    ).toBe(75);
    expect(effects.record).toHaveBeenCalledWith({
      baselineId: BASELINE,
      runs: 2,
      suite: 'skills',
    });
  });
});

describe('runner wiring at the session limit', () => {
  it.each(Object.entries(BASELINE_RUNNERS))(
    '%s stops its batches at the limit and exits with the limit code',
    (_suite, { path }) => {
      const source = readFileSync(new URL(path, import.meta.url), 'utf8');
      const batches = source.match(/\brunBatches\(/gu) ?? [];

      expect(batches.length).toBeGreaterThan(0);
      expect(source.match(/\brecord\.isCutOff,/gu) ?? []).toHaveLength(
        batches.length,
      );
      expect(source).toContain('process.exitCode = runExitCode(error);');
    },
  );
});
