import type { AuthClaims } from './auth.types';

type DecodeAuthClaimsArgs = {
  readonly payload: string;
};

/**
 * Decodes a base64url token payload back into {@link AuthClaims}, returning
 * `undefined` — never throwing — for anything that is not a well-formed claims
 * object (bad base64, invalid JSON, missing/mistyped fields). A tampered or
 * garbage payload therefore simply fails to authenticate.
 *
 * Pure: a total function of its input with no side effects.
 */
export const decodeAuthClaims = ({
  payload,
}: DecodeAuthClaimsArgs): AuthClaims | undefined => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return undefined;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return undefined;
  }

  const { exp, iat, jti, sub } = parsed as Record<string, unknown>;

  if (
    typeof exp !== 'number' ||
    typeof iat !== 'number' ||
    typeof jti !== 'string' ||
    typeof sub !== 'string'
  ) {
    return undefined;
  }

  return { exp, iat, jti, sub };
};
