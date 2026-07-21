import { describe, expect, it } from 'vitest';

import { hashSecret } from './hash-secret.util.ts';

describe('hashSecret', () => {
  it('produces the <saltHex>:<hashHex> format', () => {
    const hash = hashSecret({ secret: 'correct horse battery staple' });

    expect(hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
  });

  it('uses a fresh salt each call (same secret hashes differently)', () => {
    const first = hashSecret({ secret: 'same-secret' });
    const second = hashSecret({ secret: 'same-secret' });

    expect(first).not.toBe(second);
  });
});
