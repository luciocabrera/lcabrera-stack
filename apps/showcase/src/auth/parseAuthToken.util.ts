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
 * here it is a recomputed signature, and its first half is the signed message.
 * Borrowing left `parsed.secret` holding a signature, which CodeQL read as a credential
 * flowing into a fast hash (`js/insufficient-password-hash`, alert 1). The crypto was
 * never wrong — an HMAC is correct for a signature and must stay deterministic so
 * verification can recompute it, while the password itself goes through scrypt
 * (`isSecretHashValid`). Only the naming was. So do not "deduplicate" this against
 * `@lcabrera/server`'s API-token utils: the shapes line up and the contracts do not,
 * and the merge re-opens that alert.
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
