import { describe, expect, it } from 'vite-plus/test';

import { resolveFetchSignal } from './resolve-fetch-signal.util.ts';

describe('resolveFetchSignal', () => {
  it('returns undefined when neither source is given, so fetch is called as before', () => {
    expect(resolveFetchSignal({})).toBeUndefined();
  });

  it('passes the caller signal straight through when there is no timeout', () => {
    const controller = new AbortController();

    expect(resolveFetchSignal({ signal: controller.signal })).toBe(
      controller.signal,
    );
  });

  it('returns a timeout-backed signal when only a timeout is given', () => {
    const signal = resolveFetchSignal({ timeoutMs: 5 });

    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);
  });

  it('aborts with a TimeoutError once the timeout elapses', async () => {
    const signal = resolveFetchSignal({ timeoutMs: 1 });

    await new Promise((resolve) => {
      signal?.addEventListener('abort', resolve, { once: true });
    });

    expect(signal?.aborted).toBe(true);
    expect(signal?.reason).toMatchObject({ name: 'TimeoutError' });
  });

  it('still honours the caller signal when a timeout is also given', () => {
    const controller = new AbortController();
    const signal = resolveFetchSignal({
      signal: controller.signal,
      timeoutMs: 10_000,
    });

    controller.abort();

    expect(signal?.aborted).toBe(true);
    expect(signal?.reason).toMatchObject({ name: 'AbortError' });
  });

  it('preserves the caller reason so the two abort sources stay tellable apart', () => {
    const controller = new AbortController();
    const signal = resolveFetchSignal({
      signal: controller.signal,
      timeoutMs: 10_000,
    });

    controller.abort(new Error('superseded by a newer page request'));

    expect(signal?.reason).toMatchObject({
      message: 'superseded by a newer page request',
    });
  });

  it('is already aborted when the caller signal was aborted before the call', () => {
    const controller = new AbortController();
    controller.abort();

    const signal = resolveFetchSignal({
      signal: controller.signal,
      timeoutMs: 10_000,
    });

    expect(signal?.aborted).toBe(true);
  });
});
