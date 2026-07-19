import type { AuthClaims } from './auth.types';

import { readAuthCookie } from './readAuthCookie.util';
import { verifyAuthToken } from './verifyAuthToken.util';

type ResolveAuthClaimsArgs = {
  readonly nowSeconds: number;
  readonly request: Request;
  readonly secret: string;
};

/**
 * The single "is this request authenticated?" resolver, shared by
 * `authMiddleware` (guards) and the login loader (bounce already-signed-in
 * users). Reads the cookie then verifies its token, returning the claims or
 * `undefined`.
 *
 * Pure given its inputs: the signing `secret` and `nowSeconds` are injected by
 * the caller (the effect home), keeping this composition deterministic and
 * testable while avoiding a second copy of the read-then-verify logic.
 */
export const resolveAuthClaims = async ({
  nowSeconds,
  request,
  secret,
}: ResolveAuthClaimsArgs): Promise<AuthClaims | undefined> => {
  const token = await readAuthCookie({ request });
  if (!token) {
    return undefined;
  }

  return verifyAuthToken({ nowSeconds, secret, token });
};
