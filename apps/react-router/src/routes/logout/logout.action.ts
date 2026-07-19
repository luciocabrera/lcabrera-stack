import { redirect } from 'react-router';

import { LOGIN_ROUTE } from '@/auth/auth.constants';
import { authCookie } from '@/auth/authCookie';

/**
 * Logs the user out: overwrites the auth cookie with an already-expired one
 * (so the browser drops it) and redirects to `/login`. Exposed only as an
 * action — logout mutates session state, so it must be a POST, never a GET a
 * prefetch or link could trigger. No loader/component: a GET to `/logout`
 * falls through to a 405, which is the correct answer.
 */
export const action = async () => {
  const clearedCookie = await authCookie.serialize('', {
    expires: new Date(0),
  });

  return redirect(LOGIN_ROUTE, {
    headers: { 'Set-Cookie': clearedCookie },
  });
};
