import { authenticateUser } from '@repo/scan-ingestion/queries/authenticateUser.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import { getSessionStorage } from '@/auth/getSessionStorage.util';

import { loginSchema } from './login.schema';

const DEFAULT_REDIRECT = '/cqms/projects';

/**
 * Only same-origin absolute paths are honored — a `//evil.example` or
 * fully-qualified URL in ?redirectTo would otherwise turn the login form
 * into an open redirect.
 */
const resolveRedirectTo = (request: Request): string => {
  const redirectTo = new URL(request.url).searchParams.get('redirectTo');
  if (redirectTo === null) return DEFAULT_REDIRECT;
  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }
  return redirectTo;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    password: formData.get('password'),
    username: formData.get('username'),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        password: fieldErrors.password?.[0],
        username: fieldErrors.username?.[0],
      },
    };
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

  return redirect(resolveRedirectTo(request), {
    headers: { 'Set-Cookie': await commitSession(session) },
  });
};
