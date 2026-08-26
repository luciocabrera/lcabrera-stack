import type { MiddlewareFunction } from 'react-router';

import { redirect } from 'react-router';

import { authContext } from './authContext';
import { buildLoginRedirectUrl } from './buildLoginRedirectUrl.util';
import { readAuthEnvConfig } from './env.schema';
import { resolveAuthClaims } from './resolveAuthClaims.util';

export const authMiddleware: MiddlewareFunction<Response> = async ({
  context,
  request,
}) => {
  const { AUTH_TOKEN_SECRET } = readAuthEnvConfig({ env: process.env });
  const claims = await resolveAuthClaims({
    nowSeconds: Math.floor(Date.now() / 1000),
    request,
    secret: AUTH_TOKEN_SECRET,
  });

  if (claims === undefined) {
    throw redirect(buildLoginRedirectUrl({ request }));
  }

  context.set(authContext, claims);
};
