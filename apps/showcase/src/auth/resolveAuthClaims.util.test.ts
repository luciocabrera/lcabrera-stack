import { describe, expect, it } from 'vite-plus/test';

import type { AuthClaims } from './auth.types';

import { authCookie } from './authCookie';
import { resolveAuthClaims } from './resolveAuthClaims.util';
import { signAuthToken } from './signAuthToken.util';

const SECRET = 'resolve-test-secret';
const CLAIMS: AuthClaims = {
  exp: 2000,
  iat: 1000,
  jti: 'nonce',
  sub: 'demo@example.com',
};

const requestWithToken = async (token: string) => {
  const setCookie = await authCookie.serialize(token);
  return new Request('http://localhost/enterprise-orders', {
    headers: { Cookie: setCookie.split(';', 1)[0] ?? '' },
  });
};

describe('resolveAuthClaims', () => {
  it('resolves claims from a valid cookie token', async () => {
    const request = await requestWithToken(
      signAuthToken({ claims: CLAIMS, secret: SECRET }),
    );

    await expect(
      resolveAuthClaims({ nowSeconds: 1500, request, secret: SECRET }),
    ).resolves.toEqual(CLAIMS);
  });

  it('returns undefined when there is no cookie', async () => {
    await expect(
      resolveAuthClaims({
        nowSeconds: 1500,
        request: new Request('http://localhost/enterprise-orders'),
        secret: SECRET,
      }),
    ).resolves.toBeUndefined();
  });

  it('returns undefined for an expired token', async () => {
    const request = await requestWithToken(
      signAuthToken({ claims: CLAIMS, secret: SECRET }),
    );

    await expect(
      resolveAuthClaims({ nowSeconds: 2000, request, secret: SECRET }),
    ).resolves.toBeUndefined();
  });
});
