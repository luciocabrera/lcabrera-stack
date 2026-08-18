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

/**
 * Authoritative server login. Re-validates with the shared Zod schema (the
 * `clientAction` already validated in the browser, but the server never
 * trusts that), verifies the credential against the demo account's stored
 * hash, then mints a signed auth token, sets it as an httpOnly cookie, and
 * redirects to the sanitized `redirectTo`.
 *
 * Both failure branches return one no-oracle message so an attacker can't tell
 * an unknown email from a wrong password.
 */
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
  // A plain random nonce. This used to call `generateApiToken()` and keep only
  // its `tokenId`, which minted a 256-bit bearer secret and a full plaintext
  // token to throw both away — and made a token *identifier* stand in for a
  // nonce, so the claim read as a credential to CodeQL. Web Crypto rather than
  // `node:crypto`: a nonce needs nothing Node-specific, and this file is not a
  // `.server.ts`, where the import boundary confines built-ins. 122 bits of
  // entropy, against that tokenId's 64.
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
