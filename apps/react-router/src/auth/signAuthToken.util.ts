import type { AuthClaims } from './auth.types';

import { signAuthPayload } from './signAuthPayload.server';

type SignAuthTokenArgs = {
  readonly claims: AuthClaims;
  readonly secret: string;
};

/**
 * Serializes claims into a stateless, self-verifying token: `<payload>.<signature>`, where
 * `payload` is the base64url-encoded claims JSON and `signature` is the HMAC of that
 * payload.
 */
export const signAuthToken = ({ claims, secret }: SignAuthTokenArgs) => {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = signAuthPayload({ payload, secret });

  return `${payload}.${signature}`;
};
