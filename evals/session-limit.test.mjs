import { describe, expect, it } from 'vite-plus/test';

import { runBatches, sessionMetrics } from './agent-sessions.mjs';
import {
  rulesPlan as plan,
  testIdentity,
  rulesTrial as trial,
} from './envelope-test-support.mjs';
import { quietConsole, recording } from './run-record-test-support.mjs';
import { runExitCode, SessionLimitError } from './run-record.mjs';

const LIMIT_TEXT = "You've hit your session limit · resets 7:50pm (UTC)";

const TIMESTAMPS = { finished: 3, queued: 0, started: 1 };

const rejected = (status) => ({
  rate_limit_info: { rateLimitType: 'five_hour', status },
  type: 'rate_limit_event',
});

const result = (overrides) => ({
  is_error: false,
  subtype: 'success',
  type: 'result',
  ...overrides,
});

const classOf = (messages, thrown) =>
  sessionMetrics(messages, TIMESTAMPS, thrown).error_class;

const limitedTrial = {
  ...trial,
  error_class: 'session_limit',
  outcome: 'error',
};

const rejectionOf = async (pending) => {
  try {
    await pending;
    return;
  } catch (error) {
    return error;
  }
};

const recordingJob =
  ({ addTrial, started, value }) =>
  () => {
    started.push(value);
    addTrial(value);
    return value;
  };

quietConsole();

describe('the session-limit error class', () => {
  it('classes the session limit apart from any other rate limit', () => {
    const limited = result({
      api_error_status: 429,
      is_error: true,
      result: LIMIT_TEXT,
      terminal_reason: 'api_error',
    });
    const throttled = result({ api_error_status: 429, is_error: true });

    expect(classOf([rejected('rejected'), limited])).toBe('session_limit');
    expect(classOf([limited])).toBe('session_limit');
    expect(classOf([rejected('rejected'), throttled])).toBe('session_limit');
    expect(classOf([rejected('allowed_warning'), throttled])).toBe(
      'rate_limit',
    );
    expect(classOf([rejected('rejected'), result({})])).toBeNull();
    expect(classOf([], LIMIT_TEXT)).toBe('session_limit');
  });
});

describe('runBatches when told to stop', () => {
  it('starts no batch once told to stop, and keeps what already ran', async () => {
    const started = [];
    const batches = [1, 2, 3, 4].map((value) => [
      recordingJob({ addTrial: () => undefined, started, value }),
    ]);

    expect(await runBatches(batches, () => started.includes(2))).toStrictEqual([
      1, 2,
    ]);
    expect(started).toStrictEqual([1, 2]);
  });
});

describe('recordRun at the session limit', () => {
  it('starts nothing after a trial hits the limit, saves the run partial and exits 75', async () => {
    const { ingest, record, written } = recording({ plan });
    const started = [];
    const thrown = await rejectionOf(
      record({
        execute: ({ addTrial, isCutOff }) =>
          runBatches(
            [trial, limitedTrial, trial].map((value) => [
              recordingJob({ addTrial, started, value }),
            ]),
            isCutOff,
          ),
      }),
    );

    expect(thrown).toBeInstanceOf(SessionLimitError);
    expect(thrown.message).toContain(
      `the session limit cut run ${testIdentity.run_id} off after 2 trial(s)`,
    );
    expect(runExitCode(thrown)).toBe(75);
    expect(started).toStrictEqual([trial, limitedTrial]);
    expect(written()).toMatchObject({
      run: { status: 'partial', totals: { trials: 2 } },
    });
    expect(ingest).toHaveBeenCalledOnce();
  });

  it('reports the limit even when the runner throws after it', async () => {
    const { record, written } = recording({ plan });

    await expect(
      record({
        execute: ({ addTrial }) => {
          addTrial(limitedTrial);
          throw new Error('no session to judge');
        },
      }),
    ).rejects.toBeInstanceOf(SessionLimitError);
    expect(written().run.status).toBe('partial');
  });

  it('exits 1 for any failure but the session limit', () => {
    expect(runExitCode(new Error('usage limit reached'))).toBe(1);
    expect(runExitCode('thrown text')).toBe(1);
  });
});
