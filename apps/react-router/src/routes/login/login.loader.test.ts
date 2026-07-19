import type { LoaderFunctionArgs } from 'react-router';

import { describe, expect, it } from 'vitest';

import { authCookie } from '@/auth/authCookie';
import { readAuthEnvConfig } from '@/auth/env.schema';
import { signAuthToken } from '@/auth/signAuthToken.util';

import { loader } from './login.loader';

const SECRET = readAuthEnvConfig({ env: process.env }).AUTH_TOKEN_SECRET;

type InvokeArgs = {
  readonly cookie?: string;
  readonly url: string;
};

const invoke = ({ cookie, url }: InvokeArgs) =>
  loader({
    request: new Request(url, cookie ? { headers: { Cookie: cookie } } : {}),
  } as LoaderFunctionArgs);

const validCookieHeader = async () => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const token = signAuthToken({
    claims: {
      exp: nowSeconds + 3600,
      iat: nowSeconds,
      jti: 'nonce',
      sub: 'demo@example.com',
    },
    secret: SECRET,
  });
  const setCookie = await authCookie.serialize(token);
  return setCookie.split(';', 1)[0] ?? '';
};

describe('login loader', () => {
  it('defaults redirectTo when the query is absent', async () => {
    await expect(invoke({ url: 'http://localhost/login' })).resolves.toEqual({
      redirectTo: '/',
    });
  });

  it('surfaces a sanitized redirectTo from the query', async () => {
    await expect(
      invoke({ url: 'http://localhost/login?redirectTo=/enterprise-orders' }),
    ).resolves.toEqual({ redirectTo: '/enterprise-orders' });
  });

  it('drops an unsafe redirectTo', async () => {
    await expect(
      invoke({ url: 'http://localhost/login?redirectTo=https://evil.example' }),
    ).resolves.toEqual({ redirectTo: '/' });
  });

  it('bounces an already-authenticated visitor to their destination', async () => {
    const cookie = await validCookieHeader();
    let thrown: unknown;

    try {
      await invoke({
        cookie,
        url: 'http://localhost/login?redirectTo=/enterprise-orders',
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(302);
    expect((thrown as Response).headers.get('Location')).toBe(
      '/enterprise-orders',
    );
  });
});
