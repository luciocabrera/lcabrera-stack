import { createCookie } from 'react-router';

import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS } from './auth.constants';

export const authCookie = createCookie(AUTH_COOKIE_NAME, {
  httpOnly: true,
  maxAge: AUTH_TOKEN_TTL_SECONDS,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
});
