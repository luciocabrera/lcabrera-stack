import type { ClientActionFunctionArgs } from 'react-router';

import { loginSchema } from './login.schema';
import { toLoginFieldErrors } from './toLoginFieldErrors.util';

/**
 * Client-first validation gate (the showcase's clientAction → serverAction
 * pattern). Runs the shared Zod schema **in the browser**: on failure it
 * returns `{ errors }` instantly with no network round-trip; only on success
 * does it delegate to the server `action` (`serverAction()`), which
 * re-validates authoritatively and performs the login. The hidden `redirectTo`
 * field rides along in the same FormData, so no extra plumbing is needed here.
 */
export const clientAction = async ({
  request,
  serverAction,
}: ClientActionFunctionArgs) => {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { errors: toLoginFieldErrors({ error: parsed.error }) };
  }

  return serverAction();
};
