import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createNotificationId } from './createNotificationId.service';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createNotificationId', () => {
  it('returns a non-empty string id', () => {
    const id = createNotificationId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique ids across successive calls', () => {
    const ids = new Set(
      Array.from({ length: 50 }, () => createNotificationId()),
    );
    expect(ids.size).toBe(50);
  });

  it('uses crypto.randomUUID when it is available', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-from-crypto' });

    expect(createNotificationId()).toBe('uuid-from-crypto');
  });

  it('falls back to a timestamp+counter id when randomUUID is unavailable', () => {
    // A crypto object without randomUUID forces the fallback generator.
    vi.stubGlobal('crypto', {});

    const first = createNotificationId();
    const second = createNotificationId();

    expect(first).toMatch(/^notification-\d+-\d+$/);
    expect(second).toMatch(/^notification-\d+-\d+$/);
    // The monotonic counter guarantees distinct ids even within one millisecond.
    expect(first).not.toBe(second);
  });
});
