import { describe, expect, it } from 'vite-plus/test';

import {
  chunk,
  drain,
  errorText,
  runBatches,
  sessionProblem,
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

describe('drain', () => {
  const session = async function* (fail) {
    yield { type: 'system' };
    if (fail) {
      throw new Error('Reached maximum number of turns (1)');
    }
    yield { type: 'result' };
  };

  it('collects every message from a session that finished', async () => {
    expect(await drain(session(false))).toStrictEqual({
      messages: [{ type: 'system' }, { type: 'result' }],
    });
  });

  it('keeps the messages received before a throw, and the reason', async () => {
    expect(await drain(session(true))).toStrictEqual({
      error: 'Reached maximum number of turns (1)',
      messages: [{ type: 'system' }],
    });
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
