import { redirect } from 'react-router';

import { LOGIN_ROUTE } from '@/auth/auth.constants';
import { authCookie } from '@/auth/authCookie';

export const action = async () => {
  const clearedCookie = await authCookie.serialize('', {
    expires: new Date(0),
  });

  return redirect(LOGIN_ROUTE, {
    headers: { 'Set-Cookie': clearedCookie },
  });
};
