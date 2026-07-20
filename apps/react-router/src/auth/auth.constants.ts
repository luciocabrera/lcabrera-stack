/**
 * Shared, client-safe auth constants. Nothing here touches `node:crypto` or
 * the environment, so this file is safe to import from either a server module
 * (middleware/action) or a client one (a redirect helper) without pulling
 * server-only code into the browser bundle.
 */

/** Name of the httpOnly cookie that carries the signed auth token. */
export const AUTH_COOKIE_NAME = '__rr_auth';

/**
 * Token lifetime in seconds (8 hours). The cookie's `Max-Age` mirrors this so
 * the browser drops it around expiry, but the authoritative check is the
 * signed `exp` claim verified server-side on every request.
 */
export const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 8;

/** Where an already-authenticated user (or a login with no `redirectTo`) lands. */
export const DEFAULT_AUTHENTICATED_REDIRECT = '/';

/** The login route path, used to build guard redirects. */
export const LOGIN_ROUTE = '/login';

/** The logout route path — a POST-only action that clears the auth cookie. */
export const LOGOUT_ROUTE = '/logout';
