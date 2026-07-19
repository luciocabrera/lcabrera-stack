import { describe, expect, it } from 'vitest';

import type { AuthClaims } from './auth.types';

import { decodeAuthClaims } from './decodeAuthClaims.util';
import { signAuthPayload } from './signAuthPayload.server';
import { signAuthToken } from './signAuthToken.util';

const CLAIMS: AuthClaims = {
  exp: 2000,
  iat: 1000,
  jti: 'nonce',
  sub: 'demo@example.com',
};

describe('signAuthToken', () => {
  it('produces a single-dot <payload>.<signature> token', () => {
    const token = signAuthToken({ claims: CLAIMS, secret: 's' });

    expect(token.split('.')).toHaveLength(2);
  });

  it('embeds the claims in the recoverable payload half', () => {
    const [payload] = signAuthToken({ claims: CLAIMS, secret: 's' }).split(
      '.',
      1,
    );

    expect(decodeAuthClaims({ payload: payload ?? '' })).toEqual(CLAIMS);
  });

  it('signs the payload with the given secret', () => {
    const [payload, signature] = signAuthToken({
      claims: CLAIMS,
      secret: 'the-secret',
    }).split('.', 2);

    expect(signature).toBe(
      signAuthPayload({ payload: payload ?? '', secret: 'the-secret' }),
    );
  });

  it('yields different tokens for different secrets', () => {
    expect(signAuthToken({ claims: CLAIMS, secret: 'a' })).not.toBe(
      signAuthToken({ claims: CLAIMS, secret: 'b' }),
    );
  });
});
