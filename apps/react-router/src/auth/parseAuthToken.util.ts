export type ParsedAuthToken = {
  readonly payload: string;
  readonly signature: string;
};

type ParseAuthTokenArgs = {
  readonly token: string;
};

/**
 * Splits a signed auth token (`<payload>.<signature>`) into its halves, returning
 * undefined — never throwing — for anything malformed, so a garbage cookie simply fails to
 * authenticate.
 * Deliberately NOT `parseApiToken`. This used to borrow it because the `.` separator
 * matched, but the contracts differ: a bearer token's second half is a looked-up secret;
 * here it is a recomputed signature. Borrowing left `parsed.secret` holding a signature.
 */
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
