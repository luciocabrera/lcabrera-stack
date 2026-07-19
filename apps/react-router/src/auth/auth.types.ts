/**
 * The verified identity carried through a request once the auth cookie's
 * token has been validated. These claims are minted at login, signed into
 * the cookie, and re-verified (signature + expiry) on every guarded request
 * by {@link authMiddleware}, which publishes them on {@link authContext}.
 *
 * Timestamps are unix **seconds** (not milliseconds) so they stay compact in
 * the signed payload and align with conventional JWT-style `iat`/`exp`.
 */
export type AuthClaims = {
  /** Expiry, unix seconds. The token is invalid once `exp <= now`. */
  readonly exp: number;
  /** Issued-at, unix seconds. */
  readonly iat: number;
  /** Unique token id (a nonce) — makes each session token distinct and revocable. */
  readonly jti: string;
  /** Subject — the authenticated user's email. */
  readonly sub: string;
};

/** A resolved demo credential: an identifier plus the stored password hash. */
export type DemoCredential = {
  readonly email: string;
  readonly secretHash: string;
};
