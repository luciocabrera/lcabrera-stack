import type { ActionFunctionArgs } from 'react-router';

import { describe, expect, it } from 'vite-plus/test';

import { authCookie } from '@/auth/authCookie';
import { readAuthEnvConfig } from '@/auth/env.schema';
import { verifyAuthToken } from '@/auth/verifyAuthToken.util';

import { action } from './login.action';

// The mode is named rather than inherited from the runner — reading the ambient
// env alone made this file's import depend on Vitest exporting NODE_ENV=test,
// so a runner already exporting `production` failed it at import time with a
// secret error rather than a test failure.
//
// The rest of the env is kept, and that half matters just as much: the code
// under test reads `process.env` at request time, so dropping it would leave
// this signing with the published default while the subject verifies with
// whatever `AUTH_TOKEN_SECRET` the environment actually holds.
const SECRET = readAuthEnvConfig({
  env: { ...process.env, NODE_ENV: 'test' },
}).AUTH_TOKEN_SECRET;

const invoke = (fields: Record<string, string>) =>
  action({
    request: new Request('http://localhost/login', {
      body: new URLSearchParams(fields),
      method: 'POST',
    }),
  } as ActionFunctionArgs);

describe('login action', () => {
  it('returns field errors when the submission fails Zod validation', async () => {
    const result = await invoke({ email: 'demo@example.com', password: 'x' });

    if (result instanceof Response) {
      throw new TypeError('expected validation errors, got a redirect');
    }
    expect(result.errors.password).toBeDefined();
  });

  it('returns a no-oracle error for wrong credentials', async () => {
    const result = await invoke({
      email: 'demo@example.com',
      password: 'definitely-the-wrong-password',
    });

    if (result instanceof Response) {
      throw new TypeError('expected credential rejection, got a redirect');
    }
    expect(result.errors).toEqual({ password: 'Invalid email or password.' });
  });

  it('mints a signed cookie and redirects on valid credentials', async () => {
    const result = await invoke({
      email: 'demo@example.com',
      password: 'demo-password-123',
      redirectTo: '/enterprise-orders',
    });

    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/enterprise-orders');

    const setCookie = response.headers.get('Set-Cookie') ?? '';
    expect(setCookie).toContain('__rr_auth=');

    const token = await authCookie.parse(setCookie.split(';', 1)[0] ?? '');
    const claims = verifyAuthToken({
      nowSeconds: Math.floor(Date.now() / 1000),
      secret: SECRET,
      token: typeof token === 'string' ? token : '',
    });
    expect(claims?.sub).toBe('demo@example.com');
  });

  it('ignores an unsafe redirectTo and falls back to the default', async () => {
    const result = await invoke({
      email: 'demo@example.com',
      password: 'demo-password-123',
      redirectTo: 'https://evil.example',
    });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe('/');
  });
});
