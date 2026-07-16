import { type ActionFunctionArgs, redirect } from 'react-router';

import { getSessionStorage } from '@/auth/getSessionStorage.util';

/**
 * Action-only (POST) — logout mutates auth state, so it is never a GET
 * a crawler or prefetch could trigger.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { destroySession, getSession } = getSessionStorage();
  const session = await getSession(request.headers.get('Cookie'));

  return redirect('/login', {
    headers: { 'Set-Cookie': await destroySession(session) },
  });
};
