import { describe, expect, it } from 'vitest';

import { hashApiToken } from './hashApiToken.util.ts';

describe('hashApiToken', () => {
  it('produces a <saltHex>:<hashHex> string', () => {
    const hash = hashApiToken({ secret: 'a-secret' });
    const [saltHex, hashHex] = hash.split(':', 2);

    expect(saltHex).toMatch(/^[0-9a-f]{32}$/);
    expect(hashHex).toMatch(/^[0-9a-f]{128}$/);
  });

  it('uses a fresh salt each call (same secret hashes differently)', () => {
    expect(hashApiToken({ secret: 'same' })).not.toBe(
      hashApiToken({ secret: 'same' }),
    );
  });
});
