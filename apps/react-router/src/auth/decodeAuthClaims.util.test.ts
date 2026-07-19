import { describe, expect, it } from 'vitest';

import type { AuthClaims } from './auth.types';

import { decodeAuthClaims } from './decodeAuthClaims.util';

const encode = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const CLAIMS: AuthClaims = {
  exp: 2000,
  iat: 1000,
  jti: 'nonce',
  sub: 'demo@example.com',
};

describe('decodeAuthClaims', () => {
  it('round-trips a well-formed payload', () => {
    expect(decodeAuthClaims({ payload: encode(CLAIMS) })).toEqual(CLAIMS);
  });

  it('returns undefined for a non-base64/invalid-JSON payload', () => {
    expect(
      decodeAuthClaims({ payload: 'not-valid-base64-json!!!' }),
    ).toBeUndefined();
  });

  it('returns undefined when a field is missing', () => {
    const withoutExp = { iat: CLAIMS.iat, jti: CLAIMS.jti, sub: CLAIMS.sub };

    expect(decodeAuthClaims({ payload: encode(withoutExp) })).toBeUndefined();
  });

  it('returns undefined when a field has the wrong type', () => {
    expect(
      decodeAuthClaims({ payload: encode({ ...CLAIMS, exp: '2000' }) }),
    ).toBeUndefined();
  });

  it('returns undefined for a non-object payload', () => {
    expect(decodeAuthClaims({ payload: encode('a string') })).toBeUndefined();
  });
});
