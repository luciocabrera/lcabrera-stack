import { type LoaderFunctionArgs, redirect } from 'react-router';

import { readAuthEnvConfig } from '@/auth/env.schema';
import { resolveAuthClaims } from '@/auth/resolveAuthClaims.util';

import { resolveRedirectTo } from './resolveRedirectTo.util';

/**
 * Prepares the login page: reads (and sanitizes) `redirectTo` from the query so
 * the form can round-trip it, and bounces an already-authenticated visitor
 * straight to their destination — this IS the login page, so it never guards
 * itself into a redirect loop.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const redirectTo = resolveRedirectTo({
    candidate: new URL(request.url).searchParams.get('redirectTo'),
  });

  const { AUTH_TOKEN_SECRET } = readAuthEnvConfig({ env: process.env });
  const claims = await resolveAuthClaims({
    nowSeconds: Math.floor(Date.now() / 1000),
    request,
    secret: AUTH_TOKEN_SECRET,
  });

  if (claims !== undefined) {
    throw redirect(redirectTo);
  }

  return { redirectTo };
};
