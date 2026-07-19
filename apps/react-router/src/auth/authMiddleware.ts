import { type MiddlewareFunction, redirect } from 'react-router';

import { authContext } from './authContext';
import { buildLoginRedirectUrl } from './buildLoginRedirectUrl.util';
import { readAuthEnvConfig } from './env.schema';
import { resolveAuthClaims } from './resolveAuthClaims.util';

/**
 * Reusable RR7 server middleware that guards a route (and its children).
 *
 * Read the auth cookie → verify the token (signature + expiry) → on failure
 * `throw redirect('/login?redirectTo=<current-url>')`, on success publish the
 * verified claims on {@link authContext} for downstream loaders/actions.
 *
 * Apply it to any route by exporting `middleware = [authMiddleware]` from that
 * route module — e.g. an enterprise-orders layout guards its whole subtree.
 * Returning `void` lets React Router continue to the next handler; the guard
 * only ever short-circuits by throwing the redirect.
 *
 * The env read and clock read live here (a designated effect home); everything
 * they feed — `resolveAuthClaims`, `buildLoginRedirectUrl` — stays pure.
 */
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
