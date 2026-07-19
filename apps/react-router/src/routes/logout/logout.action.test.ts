import { describe, expect, it } from 'vitest';

import { action } from './logout.action';

describe('logout action', () => {
  it('clears the auth cookie and redirects to /login', async () => {
    const response = await action();

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/login');

    const setCookie = response.headers.get('Set-Cookie') ?? '';
    expect(setCookie).toContain('__rr_auth=');
    // An already-elapsed Expires (epoch) tells the browser to drop the cookie.
    expect(setCookie).toContain('Expires=Thu, 01 Jan 1970');
  });
});
