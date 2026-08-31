import type { AuthClaims } from './auth.types';

import { signAuthPayload } from './signAuthPayload.server';

type SignAuthTokenArgs = {
  readonly claims: AuthClaims;
  readonly secret: string;
};

export const signAuthToken = ({ claims, secret }: SignAuthTokenArgs) => {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = signAuthPayload({ payload, secret });

  return `${payload}.${signature}`;
};
