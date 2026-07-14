import { describe, expect, it } from 'vitest';

import { hashApiToken } from './hashApiToken.util.ts';
import { isApiTokenValid } from './isApiTokenValid.util.ts';

describe('isApiTokenValid', () => {
  it('accepts the secret that produced the hash', () => {
    const secret = 'the-real-secret';
    const tokenHash = hashApiToken({ secret });

    expect(isApiTokenValid({ secret, tokenHash })).toBe(true);
  });

  it('rejects a wrong secret', () => {
    const tokenHash = hashApiToken({ secret: 'the-real-secret' });

    expect(isApiTokenValid({ secret: 'wrong', tokenHash })).toBe(false);
  });

  it('returns false (never throws) for a malformed stored hash', () => {
    expect(isApiTokenValid({ secret: 'x', tokenHash: 'not-a-hash' })).toBe(
      false,
    );
    expect(isApiTokenValid({ secret: 'x', tokenHash: '' })).toBe(false);
    expect(isApiTokenValid({ secret: 'x', tokenHash: 'zz:zz' })).toBe(false);
  });
});
