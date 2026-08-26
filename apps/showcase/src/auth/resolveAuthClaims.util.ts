import type { AuthClaims } from './auth.types';

import { readAuthCookie } from './readAuthCookie.util';
import { verifyAuthToken } from './verifyAuthToken.util';

type ResolveAuthClaimsArgs = {
  readonly nowSeconds: number;
  readonly request: Request;
  readonly secret: string;
};

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
