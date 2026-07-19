import { createContext } from 'react-router';

import type { AuthClaims } from './auth.types';

/**
 * Request-scoped context holding the verified {@link AuthClaims} for the
 * current request. `authMiddleware` sets it once the auth cookie's token is
 * validated; downstream loaders/actions read it with `context.get(authContext)`.
 *
 * No default value is provided on purpose: reading it before the middleware
 * has run throws instead of silently yielding a bogus "anonymous" identity —
 * a guarded route that forgot its middleware fails loudly rather than leaking.
 */
export const authContext = createContext<AuthClaims>();
