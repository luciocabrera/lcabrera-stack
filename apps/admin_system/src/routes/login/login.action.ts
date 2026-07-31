import type { ActionFunctionArgs } from 'react-router';

import { authenticateUser } from '@repo/scan-ingestion/queries/authenticateUser.util';
import { redirect } from 'react-router';

import { getSessionStorage } from '@/auth/getSessionStorage.util';

import { loginSchema } from './login.schema';
import { resolveRedirectTo } from './resolveRedirectTo.util';
import { toLoginFieldErrors } from './toLoginFieldErrors.util';

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    password: formData.get('password'),
    username: formData.get('username'),
  });

  if (!parsed.success) {
    return { errors: toLoginFieldErrors({ error: parsed.error }) };
  }

  const user = await authenticateUser(parsed.data);
  if (user === undefined) {
    // One message for both unknown-user and wrong-password — no oracle.
    return {
      errors: { password: 'Invalid username or password.' },
    };
  }

  const { commitSession, getSession } = getSessionStorage();
  const session = await getSession(request.headers.get('Cookie'));
  session.set('userId', user.userId);

  return redirect(resolveRedirectTo({ url: request.url }), {
    headers: { 'Set-Cookie': await commitSession(session) },
  });
};
