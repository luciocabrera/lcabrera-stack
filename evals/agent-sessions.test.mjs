import { describe, expect, it } from 'vite-plus/test';

import {
  chunk,
  drain,
  errorText,
  runBatches,
  sessionMetrics,
  sessionProblem,
  timedDrain,
  withoutSeparator,
} from './agent-sessions.mjs';

describe('chunk', () => {
  it('splits into batches of at most the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toStrictEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toStrictEqual([]);
  });
});

describe('errorText', () => {
  it('reads an Error by its message and anything else as a string', () => {
    expect(errorText(new Error('turn limit'))).toBe('turn limit');
    expect(errorText('aborted')).toBe('aborted');
  });
});

describe('runBatches', () => {
  it('runs one batch at a time and keeps the results in order', async () => {
    const started = [];
    const job = (value) => async () => {
      started.push(value);
      return value;
    };
    expect(await runBatches([[job(1), job(2)], [job(3)]])).toStrictEqual([
      1, 2, 3,
    ]);
    expect(started).toStrictEqual([1, 2, 3]);
  });
});

const ticking = (start) => {
  let now = start;
  return () => {
    now += 1;
    return now;
  };
};

describe('drain', () => {
  const session = async function* (fail) {
    yield { type: 'system' };
    if (fail) {
      throw new Error('Reached maximum number of turns (1)');
    }
    yield { type: 'assistant' };
    yield { type: 'assistant' };
    yield { type: 'result' };
  };

  it('collects every message, and stamps the first answer once', async () => {
    expect(await drain(session(false), ticking(100))).toStrictEqual({
      firstTokenAt: 101,
      messages: [
        { type: 'system' },
        { type: 'assistant' },
        { type: 'assistant' },
        { type: 'result' },
      ],
    });
  });

  it('keeps the messages received before a throw, and the reason', async () => {
    expect(await drain(session(true), ticking(100))).toStrictEqual({
      error: 'Reached maximum number of turns (1)',
      firstTokenAt: undefined,
      messages: [{ type: 'system' }],
    });
  });
});

describe('timedDrain', () => {
  it('stamps the start before the session opens and the finish after it drains', async () => {
    const clock = ticking(1000);
    const opened = [];
    const open = async function* () {
      opened.push(clock());
      yield { type: 'assistant' };
      yield { type: 'result' };
    };
    expect(await timedDrain({ clock, open, queuedAt: 500 })).toStrictEqual({
      messages: [{ type: 'assistant' }, { type: 'result' }],
      timestamps: {
        finished: 1004,
        firstToken: 1003,
        queued: 500,
        started: 1001,
      },
    });
    expect(opened).toStrictEqual([1002]);
  });
});

describe('sessionMetrics', () => {
  const usage = (input, output, cacheRead, cacheWrite, costUSD) => ({
    cacheCreationInputTokens: cacheWrite,
    cacheReadInputTokens: cacheRead,
    costUSD,
    inputTokens: input,
    outputTokens: output,
  });
  const modelUsage = {
    'claude-haiku': usage(5, 6, 7, 8, 0.01),
    'claude-opus': usage(100, 200, 300, 400, 0.5),
  };
  const result = (overrides) => ({
    duration_api_ms: 1500,
    duration_ms: 2000,
    is_error: false,
    modelUsage,
    num_turns: 3,
    session_id: 'session-1',
    stop_reason: 'end_turn',
    subtype: 'success',
    total_cost_usd: 0.4242,
    ttft_ms: 250,
    type: 'result',
    ...overrides,
  });
  const timestamps = {
    finished: Date.UTC(2026, 0, 1, 0, 0, 3),
    firstToken: Date.UTC(2026, 0, 1, 0, 0, 2),
    queued: Date.UTC(2026, 0, 1, 0, 0, 0),
    started: Date.UTC(2026, 0, 1, 0, 0, 1),
  };

  it('reads a success: tokens summed across models, cost kept as reported', () => {
    expect(
      sessionMetrics([{ type: 'system' }, result({})], timestamps),
    ).toStrictEqual({
      cost_usd_reported: 0.4242,
      duration_api_ms: 1500,
      duration_ms: 2000,
      error_class: null,
      finished_at: '2026-01-01T00:00:03.000Z',
      first_token_at: '2026-01-01T00:00:01.250Z',
      model_usage: modelUsage,
      queued_at: '2026-01-01T00:00:00.000Z',
      session_id: 'session-1',
      started_at: '2026-01-01T00:00:01.000Z',
      stop_reason: 'end_turn',
      tokens: { cache_read: 307, cache_write: 408, input: 105, output: 206 },
      turns: 3,
    });
  });

  it('falls back to the stamped first answer when the result has no ttft_ms', () => {
    expect(
      sessionMetrics([result({ ttft_ms: undefined })], timestamps)
        .first_token_at,
    ).toBe('2026-01-01T00:00:02.000Z');
  });

  it('classes each error result, and never as fail', () => {
    const classOf = (overrides) =>
      sessionMetrics([result({ is_error: true, ...overrides })], timestamps)
        .error_class;
    expect(classOf({ subtype: 'error_max_turns' })).toBe('max_turns');
    expect(classOf({ subtype: 'error_max_budget_usd' })).toBe('budget');
    expect(classOf({ subtype: 'error_during_execution' })).toBe('execution');
    expect(classOf({ subtype: 'error_max_structured_output_retries' })).toBe(
      'execution',
    );
    expect(classOf({ api_error_status: 429 })).toBe('rate_limit');
    expect(
      classOf({
        subtype: 'error_during_execution',
        terminal_reason: 'blocking_limit',
      }),
    ).toBe('rate_limit');
    expect(classOf({ api_error_status: 401 })).toBe('auth');
    expect(classOf({ api_error_status: 403 })).toBe('auth');
    expect(classOf({ api_error_status: 500 })).toBe('execution');
  });

  it('keeps the cost and tokens an error result reports', () => {
    const metrics = sessionMetrics(
      [result({ is_error: true, subtype: 'error_max_turns' })],
      timestamps,
    );
    expect(metrics.cost_usd_reported).toBe(0.4242);
    expect(metrics.tokens.input).toBe(105);
  });

  it('classes a session that threw before any result', () => {
    const before = { queued: timestamps.queued, started: timestamps.started };
    expect(
      sessionMetrics([{ type: 'system' }], before, 'socket hang up'),
    ).toStrictEqual({
      cost_usd_reported: null,
      duration_api_ms: null,
      duration_ms: null,
      error_class: 'drain',
      finished_at: null,
      first_token_at: null,
      model_usage: {},
      queued_at: '2026-01-01T00:00:00.000Z',
      session_id: null,
      started_at: '2026-01-01T00:00:01.000Z',
      stop_reason: null,
      tokens: {
        cache_read: null,
        cache_write: null,
        input: null,
        output: null,
      },
      turns: null,
    });
    const thrown = (text) => sessionMetrics([], before, text).error_class;
    expect(thrown('Reached maximum number of turns (1)')).toBe('max_turns');
    expect(thrown('API Error: 429 rate_limit_error')).toBe('rate_limit');
    expect(thrown('Invalid API key · Please run /login')).toBe('auth');
    expect(sessionMetrics([], before).error_class).toBe('drain');
  });

  it('classes a throw after a successful result by the throw', () => {
    expect(
      sessionMetrics([result({})], timestamps, 'aborted').error_class,
    ).toBe('drain');
  });
});

describe('sessionProblem', () => {
  const init = (tools) => ({ subtype: 'init', tools, type: 'system' });
  const success = { subtype: 'success', type: 'result' };

  it('accepts a session with no tools that ended in success', () => {
    expect(sessionProblem([init([]), success])).toBeUndefined();
  });

  it('names the tools when the no-tools option did not take', () => {
    expect(sessionProblem([init(['Bash', 'Read']), success])).toBe(
      'the session held Bash, Read',
    );
  });

  it('accepts the expected tools in any order, and names a mismatch', () => {
    expect(
      sessionProblem([init(['Read', 'Bash']), success], ['Bash', 'Read']),
    ).toBeUndefined();
    expect(sessionProblem([init(['Bash']), success], ['Bash', 'Read'])).toBe(
      'the session held Bash instead of Bash, Read',
    );
    expect(sessionProblem([init([]), success], ['Bash'])).toBe(
      'the session held no tools instead of Bash',
    );
  });

  it('reports a session that did not finish, or never said what it held', () => {
    expect(
      sessionProblem([
        init([]),
        { is_error: true, subtype: 'error_max_turns', type: 'result' },
      ]),
    ).toBe('the session ended with error_max_turns');
    expect(sessionProblem([init([])])).toBe('the session ended with no result');
    expect(sessionProblem([success])).toBe(
      'the session never reported its tools',
    );
    expect(sessionProblem([{ subtype: 'init', type: 'system' }, success])).toBe(
      'the session reported no tool list',
    );
  });
});

describe('withoutSeparator', () => {
  it('drops the -- that vp run passes through', () => {
    expect(withoutSeparator(['--', '--runs', '3'])).toStrictEqual([
      '--runs',
      '3',
    ]);
    expect(withoutSeparator(['--runs', '3'])).toStrictEqual(['--runs', '3']);
  });
});
