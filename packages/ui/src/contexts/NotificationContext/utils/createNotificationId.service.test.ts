import { describe, expect, it } from 'vitest';

import { createNotificationId } from './createNotificationId.service';

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
});
