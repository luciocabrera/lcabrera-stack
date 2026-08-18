export type ParsedAuthToken = {
  readonly payload: string;
  readonly signature: string;
};

type ParseAuthTokenArgs = {
  readonly token: string;
};

/**
 * Splits a signed auth token (`<payload>.<signature>`) into its halves,
 * returning undefined — never throwing — for anything malformed, so a garbage
 * cookie simply fails to authenticate.
 *
 * Deliberately NOT `parseApiToken`, which this used to borrow because the `.`
 * separator matched. That primitive splits a *bearer* token, whose second half
 * is a secret the server looks up; here the second half is a signature the
 * server recomputes, and the first half is the signed message. The shapes
 * coincide, the contracts do not — and borrowing the bearer names left
 * `parsed.secret` holding a signature, which reads as a credential to a
 * reviewer and to CodeQL (`js/insufficient-password-hash` on the HMAC that
 * verifies it).
 *
 * Exactly two parts are required. `payload` is base64url and `signature` is
 * hex, so neither can contain a `.` — an extra separator means a malformed
 * token, not a signature that happens to hold one.
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
