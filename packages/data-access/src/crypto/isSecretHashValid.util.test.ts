import { describe, expect, it } from 'vitest';

import { hashSecret } from './hashSecret.util.ts';
import { isSecretHashValid } from './isSecretHashValid.util.ts';

describe('isSecretHashValid', () => {
  it('accepts the secret that produced the hash', () => {
    const secret = 'the-real-secret';
    const secretHash = hashSecret({ secret });

    expect(isSecretHashValid({ secret, secretHash })).toBe(true);
  });

  it('rejects a wrong secret', () => {
    const secretHash = hashSecret({ secret: 'the-real-secret' });

    expect(isSecretHashValid({ secret: 'wrong', secretHash })).toBe(false);
  });

  it('rejects a non-loginable sentinel hash without throwing', () => {
    expect(
      isSecretHashValid({ secret: 'anything', secretHash: '!no-login!' }),
    ).toBe(false);
  });

  it('returns false (never throws) for a malformed stored hash', () => {
    expect(isSecretHashValid({ secret: 'x', secretHash: 'not-a-hash' })).toBe(
      false,
    );
    expect(isSecretHashValid({ secret: 'x', secretHash: '' })).toBe(false);
    expect(isSecretHashValid({ secret: 'x', secretHash: 'zz:zz' })).toBe(false);
  });
});
