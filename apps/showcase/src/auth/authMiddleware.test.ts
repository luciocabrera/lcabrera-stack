import { RouterContextProvider } from 'react-router';
import { describe, expect, it } from 'vite-plus/test';

import type { AuthClaims } from './auth.types';

import { authContext } from './authContext';
import { authCookie } from './authCookie';
import { authMiddleware } from './authMiddleware';
import { readAuthEnvConfig } from './env.schema';
import { signAuthToken } from './signAuthToken.util';

const SECRET = readAuthEnvConfig({
  env: { ...process.env, NODE_ENV: 'test' },
}).AUTH_TOKEN_SECRET;

const nextStub = async () => new Response();

const invokeMiddleware = async (request: Request) => {
  const context = new RouterContextProvider();
  let thrown: unknown;

  try {
    await authMiddleware(
      {
        context,
        params: {},
        pattern: '/enterprise-orders',
        request,
        url: new URL(request.url),
      },
      nextStub,
    );
  } catch (error) {
    thrown = error;
  }

  return { context, thrown };
};

const requestWithCookie = async (token: string) => {
  const setCookie = await authCookie.serialize(token);
  return new Request('http://localhost/enterprise-orders?tab=1', {
    headers: { Cookie: setCookie.split(';', 1)[0] ?? '' },
  });
};

const validClaims = (): AuthClaims => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    exp: nowSeconds + 3600,
    iat: nowSeconds,
    jti: 'session-nonce',
    sub: 'demo@example.com',
  };
};

describe('authMiddleware', () => {
  it('redirects to /login with the return destination when no cookie is present', async () => {
    const { thrown } = await invokeMiddleware(
      new Request('http://localhost/enterprise-orders?tab=1'),
    );

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(302);
    expect((thrown as Response).headers.get('Location')).toBe(
      '/login?redirectTo=%2Fenterprise-orders%3Ftab%3D1',
    );
  });

  it('redirects to /login when the token is invalid', async () => {
    const request = await requestWithCookie('tampered.token');
    const { thrown } = await invokeMiddleware(request);

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).headers.get('Location')).toMatch(/^\/login\?/);
  });

  it('sets the verified claims on authContext for a valid token', async () => {
    const claims = validClaims();
    const request = await requestWithCookie(
      signAuthToken({ claims, secret: SECRET }),
    );

    const { context, thrown } = await invokeMiddleware(request);

    expect(thrown).toBeUndefined();
    expect(context.get(authContext)).toEqual(claims);
  });
});
