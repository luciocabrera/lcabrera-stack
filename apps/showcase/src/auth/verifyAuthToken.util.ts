import type { AuthClaims } from './auth.types';

import { decodeAuthClaims } from './decodeAuthClaims.util';
import { parseAuthToken } from './parseAuthToken.util';
import { signAuthPayload } from './signAuthPayload.server';
import { timingSafeStringEqual } from './timingSafeStringEqual.server';

type VerifyAuthTokenArgs = {
  readonly nowSeconds: number;
  readonly secret: string;
  readonly token: string;
};

/**
 * Returns claims only when everything checks out, else `undefined` (no oracle on which
 * step failed): parse, constant-time HMAC, decode claims, reject expired (`exp <= nowSeconds`).
 * `nowSeconds` is injected so this stays pure.
 */
export const verifyAuthToken = ({
  nowSeconds,
  secret,
  token,
}: VerifyAuthTokenArgs): AuthClaims | undefined => {
  const parsed = parseAuthToken({ token });
  if (parsed === undefined) {
    return undefined;
  }

  const expectedSignature = signAuthPayload({
    payload: parsed.payload,
    secret,
  });
  if (!timingSafeStringEqual({ a: parsed.signature, b: expectedSignature })) {
    return undefined;
  }

  const claims = decodeAuthClaims({ payload: parsed.payload });
  if (claims === undefined || claims.exp <= nowSeconds) {
    return undefined;
  }

  return claims;
};
