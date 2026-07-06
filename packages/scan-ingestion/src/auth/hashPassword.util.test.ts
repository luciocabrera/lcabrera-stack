import { describe, expect, it } from 'vitest';

import { hashPassword } from './hashPassword.util.ts';

describe('hashPassword', () => {
  it('produces the <saltHex>:<hashHex> format', () => {
    const hash = hashPassword({ password: 'correct horse battery staple' });

    expect(hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
  });

  it('produces a different hash for the same password each time (random salt)', () => {
    const first = hashPassword({ password: 'same-password' });
    const second = hashPassword({ password: 'same-password' });

    expect(first).not.toBe(second);
  });
});
