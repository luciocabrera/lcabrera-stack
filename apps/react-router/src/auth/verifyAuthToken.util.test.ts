import { describe, expect, it } from 'vitest';

import type { AuthClaims } from './auth.types';

import { signAuthToken } from './signAuthToken.util';
import { verifyAuthToken } from './verifyAuthToken.util';

const SECRET = 'unit-test-secret';
const CLAIMS: AuthClaims = {
  exp: 2000,
  iat: 1000,
  jti: 'nonce',
  sub: 'demo@example.com',
};

const validToken = signAuthToken({ claims: CLAIMS, secret: SECRET });

describe('verifyAuthToken', () => {
  it('returns the claims for a valid, unexpired token', () => {
    expect(
      verifyAuthToken({ nowSeconds: 1500, secret: SECRET, token: validToken }),
    ).toEqual(CLAIMS);
  });

  it('returns undefined for a malformed token (no separator)', () => {
    expect(
      verifyAuthToken({ nowSeconds: 1500, secret: SECRET, token: 'garbage' }),
    ).toBeUndefined();
  });

  it('returns undefined when the signature was made with another secret', () => {
    expect(
      verifyAuthToken({
        nowSeconds: 1500,
        secret: 'wrong-secret',
        token: validToken,
      }),
    ).toBeUndefined();
  });

  it('returns undefined when the payload is tampered with', () => {
    const [, signature] = validToken.split('.', 2);
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...CLAIMS, sub: 'attacker@example.com' }),
    ).toString('base64url');

    expect(
      verifyAuthToken({
        nowSeconds: 1500,
        secret: SECRET,
        token: `${forgedPayload}.${signature ?? ''}`,
      }),
    ).toBeUndefined();
  });

  it('returns undefined for an expired token', () => {
    expect(
      verifyAuthToken({ nowSeconds: 2000, secret: SECRET, token: validToken }),
    ).toBeUndefined();
  });
});
