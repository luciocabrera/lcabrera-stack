/**
 * Do not fold this into `@lcabrera/server`'s API-token parser. The shapes line
 * up and the contracts do not: a bearer token's second half is a looked-up
 * secret, while here it is a recomputed signature over the first half. Borrowing
 * left a signature sitting in a field named `secret`, which CodeQL read as a
 * credential flowing into a fast hash (`js/insufficient-password-hash`). The
 * merge re-opens that alert.
 */

export type ParsedAuthToken = {
  readonly payload: string;
  readonly signature: string;
};

type ParseAuthTokenArgs = {
  readonly token: string;
};

export const parseAuthToken = ({
  token,
}: ParseAuthTokenArgs): ParsedAuthToken | undefined => {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return undefined;
  }

  const [payload, signature] = parts;
  if (!payload || !signature) {
    return undefined;
  }

  return { payload, signature };
};
