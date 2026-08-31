import type { LoaderFunctionArgs } from 'react-router';

import { redirect } from 'react-router';

import { readAuthEnvConfig } from '@/auth/env.schema';
import { resolveAuthClaims } from '@/auth/resolveAuthClaims.util';

import { resolveRedirectTo } from './resolveRedirectTo.util';

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
