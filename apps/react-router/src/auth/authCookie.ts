import { createCookie } from 'react-router';

import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS } from './auth.constants';

/**
 * The transport cookie for the signed auth token. It is a plain (unsigned)
 * cookie: tamper-proofing comes from the token's own HMAC signature, which
 * `verifyAuthToken` checks — not from cookie-level signing — so there is a
 * single, testable signature story.
 *
 * `httpOnly` keeps the token out of reach of client JS (XSS), `sameSite: lax`
 * blocks CSRF on unsafe methods while still allowing top-level navigations,
 * and `maxAge` mirrors the token TTL so the browser discards it around expiry.
 * `secure` is derived from `NODE_ENV` so local http dev still works.
 *
 * Module-level init is safe: this file is only imported from server modules
 * (middleware/actions), so it is tree-shaken out of the client bundle.
 */
export const authCookie = createCookie(AUTH_COOKIE_NAME, {
  httpOnly: true,
  maxAge: AUTH_TOKEN_TTL_SECONDS,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
});
