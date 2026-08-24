import type { ClientActionFunctionArgs } from 'react-router';

import { loginSchema } from './login.schema';
import { toLoginFieldErrors } from './toLoginFieldErrors.util';

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
