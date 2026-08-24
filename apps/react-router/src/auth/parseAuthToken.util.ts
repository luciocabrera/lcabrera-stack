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
 * Deliberately NOT `parseApiToken`, which this used to borrow because the `.` separator
 * matched.
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
