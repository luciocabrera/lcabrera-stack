import { describe, expect, it } from 'vite-plus/test';

import { chunk, drain, errorText, runBatches } from './agent-sessions.mjs';

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
