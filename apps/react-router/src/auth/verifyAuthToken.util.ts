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
 * Statelessly verifies an auth token, returning its {@link AuthClaims} only
 * when everything checks out, else `undefined` (no oracle distinguishing the
 * failure modes):
 *
 * 1. Split with `parseAuthToken` — malformed shapes are rejected.
 * 2. Recompute the HMAC over the payload and compare in constant time —
 *    tampered payloads or wrong signing keys fail.
 * 3. Decode the claims — non-conforming payloads fail.
 * 4. Reject expired tokens (`exp <= nowSeconds`).
 *
 * Pure: `nowSeconds` is injected by the caller (middleware/loader) rather than
 * read from the clock here, so the whole function is deterministic and unit
 * testable.
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
