import { describe, expect, it, vi } from 'vite-plus/test';

import { startInjectedResolver } from './startInjectedResolver.util';

describe('startInjectedResolver', () => {
  it('wraps a synchronous answer in a promise', async () => {
    await expect(startInjectedResolver(() => 'answer')).resolves.toBe('answer');
  });

  it('passes an asynchronous answer through', async () => {
    await expect(startInjectedResolver(async () => 'answer')).resolves.toBe(
      'answer',
    );
  });

  it('turns a synchronous throw into a rejection instead of letting it escape', async () => {
    const started = startInjectedResolver(() => {
      throw new Error('refused');
    });

    await expect(started).rejects.toThrow('refused');
  });

  it('calls the resolver before it returns, so callers can start two at once', async () => {
    const start = vi.fn(() => 'answer');

    const started = startInjectedResolver(start);

    expect(start).toHaveBeenCalledTimes(1);
    await expect(started).resolves.toBe('answer');
  });
});
