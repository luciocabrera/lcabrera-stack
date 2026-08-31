/**
 * The auth cookie is deliberately unsigned — `createCookie` without `secrets`.
 * Tamper-proofing is the auth token's own HMAC, which gives the design a single
 * signature story; adding `secrets` here would create a second one over the same
 * bytes. This is not an oversight to harden: verify the token, not the envelope.
 */

import { createCookie } from 'react-router';

import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS } from './auth.constants';

export const authCookie = createCookie(AUTH_COOKIE_NAME, {
  httpOnly: true,
  maxAge: AUTH_TOKEN_TTL_SECONDS,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
});
