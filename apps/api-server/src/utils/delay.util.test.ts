import { afterEach, describe, expect, it, vi } from 'vitest';

import { delay } from './delay.util';

describe('delay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the requested number of milliseconds', async () => {
    vi.useFakeTimers();

    let isResolved = false;
    const promise = delay({ milliseconds: 25 }).then(() => {
      isResolved = true;
    });

    await vi.advanceTimersByTimeAsync(24);
    expect(isResolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await promise;

    expect(isResolved).toBe(true);
  });
});
