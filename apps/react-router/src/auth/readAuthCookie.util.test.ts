import { describe, expect, it } from 'vitest';

import { authCookie } from './authCookie';
import { readAuthCookie } from './readAuthCookie.util';

const cookieHeaderFor = async (token: string) => {
  const setCookie = await authCookie.serialize(token);
  return setCookie.split(';', 1)[0] ?? '';
};

const requestWithCookie = (cookie: string) =>
  new Request('http://localhost/', { headers: { Cookie: cookie } });

describe('readAuthCookie', () => {
  it('reads the token back out of the auth cookie', async () => {
    const token = 'payload.signature';
    const request = requestWithCookie(await cookieHeaderFor(token));

    await expect(readAuthCookie({ request })).resolves.toBe(token);
  });

  it('returns undefined when no cookie header is present', async () => {
    await expect(
      readAuthCookie({ request: new Request('http://localhost/') }),
    ).resolves.toBeUndefined();
  });

  it('returns undefined when only unrelated cookies are present', async () => {
    const request = requestWithCookie('theme=dark; other=1');

    await expect(readAuthCookie({ request })).resolves.toBeUndefined();
  });
});
