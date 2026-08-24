import { createContext } from 'react-router';

import type { AuthClaims } from './auth.types';

/**
 * No default value is provided on purpose: reading it before the middleware has run throws
 * instead of silently yielding a bogus "anonymous" identity — a guarded route that forgot
 * its middleware fails loudly rather than leaking.
 */
export const authContext = createContext<AuthClaims>();
