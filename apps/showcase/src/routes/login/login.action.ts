import type { ActionFunctionArgs } from 'react-router';

import { redirect } from 'react-router';

import { AUTH_TOKEN_TTL_SECONDS } from '@/auth/auth.constants';
import { authCookie } from '@/auth/authCookie';
import { readAuthEnvConfig } from '@/auth/env.schema';
import { getDemoCredential } from '@/auth/getDemoCredential.util';
import { signAuthToken } from '@/auth/signAuthToken.util';
import { verifyCredentials } from '@/auth/verifyCredentials.util';

import { loginSchema } from './login.schema';
import { resolveRedirectTo } from './resolveRedirectTo.util';
import { toLoginFieldErrors } from './toLoginFieldErrors.util';

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { errors: toLoginFieldErrors({ error: parsed.error }) };
  }

  const credential = getDemoCredential({ env: process.env });
  if (
    !verifyCredentials({
      credential,
      email: parsed.data.email,
      password: parsed.data.password,
    })
  ) {
    return { errors: { password: 'Invalid email or password.' } };
  }

  const { AUTH_TOKEN_SECRET } = readAuthEnvConfig({ env: process.env });
  const nowSeconds = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();
  const token = signAuthToken({
    claims: {
      exp: nowSeconds + AUTH_TOKEN_TTL_SECONDS,
      iat: nowSeconds,
      jti,
      sub: credential.email,
    },
    secret: AUTH_TOKEN_SECRET,
  });

  return redirect(
    resolveRedirectTo({ candidate: formData.get('redirectTo') }),
    {
      headers: { 'Set-Cookie': await authCookie.serialize(token) },
    },
  );
};
